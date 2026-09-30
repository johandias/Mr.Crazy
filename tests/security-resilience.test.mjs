import "./register-typescript.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { checkPublicRateLimit, resetPublicRateLimit, getClientIp } from "../src/lib/rate-limiter.ts";
import nextConfig from "../next.config.mjs";

test("checkPublicRateLimit allows requests under quota and enforces blocking window", () => {
  const testIp = "192.168.1.100";
  const action = "test_rate_action";

  resetPublicRateLimit(testIp, action);

  // 3 tentativas permitidas na janela de 10s
  const r1 = checkPublicRateLimit(testIp, action, 3, 10);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = checkPublicRateLimit(testIp, action, 3, 10);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = checkPublicRateLimit(testIp, action, 3, 10);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // 4ª tentativa: Deve ser bloqueada
  const r4 = checkPublicRateLimit(testIp, action, 3, 10);
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);
  assert.ok(r4.retryAfterSeconds > 0, "Deve fornecer tempo de espera positivo");

  // Reset por ação bem-sucedida
  resetPublicRateLimit(testIp, action);
  const r5 = checkPublicRateLimit(testIp, action, 3, 10);
  assert.equal(r5.allowed, true);
  assert.equal(r5.remaining, 2);
});

test("getClientIp correctly extracts client IP from proxy headers with safe fallback", () => {
  // Teste 1: x-forwarded-for com múltiplos proxies (pega o primeiro IP real)
  const req1 = new Request("https://www.mrcrazy.fun/api/auth/login", {
    headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" }
  });
  assert.equal(getClientIp(req1), "203.0.113.195");

  // Teste 2: x-real-ip
  const req2 = new Request("https://www.mrcrazy.fun/api/auth/login", {
    headers: { "x-real-ip": "198.51.100.42" }
  });
  assert.equal(getClientIp(req2), "198.51.100.42");

  // Teste 3: cf-connecting-ip
  const req3 = new Request("https://www.mrcrazy.fun/api/auth/login", {
    headers: { "cf-connecting-ip": "198.51.100.88" }
  });
  assert.equal(getClientIp(req3), "198.51.100.88");

  // Teste 4: sem cabeçalhos de proxy (fallback local seguro)
  const req4 = new Request("https://www.mrcrazy.fun/api/auth/login");
  assert.equal(getClientIp(req4), "127.0.0.1");
});

test("next.config.mjs exports defensive HTTP security headers", async () => {
  assert.ok(typeof nextConfig.headers === "function", "nextConfig deve definir headers()");
  const headersConfig = await nextConfig.headers();
  assert.ok(Array.isArray(headersConfig) && headersConfig.length > 0);

  const globalRule = headersConfig.find((r) => r.source === "/:path*");
  assert.ok(globalRule, "Deve haver regra global /:path* de segurança");

  const headerMap = new Map(globalRule.headers.map((h) => [h.key.toLowerCase(), h.value]));

  // X-Frame-Options contra clickjacking
  assert.equal(headerMap.get("x-frame-options"), "DENY");

  // X-Content-Type-Options contra MIME sniffing
  assert.equal(headerMap.get("x-content-type-options"), "nosniff");

  // Strict-Transport-Security (HSTS)
  assert.ok(headerMap.get("strict-transport-security")?.includes("max-age="));

  // Permissions-Policy: deve liberar microphone=(self) para o Mr. Crazy e bloquear camera/geolocation
  const permissionsPolicy = headerMap.get("permissions-policy") || "";
  assert.ok(permissionsPolicy.includes("microphone=(self)"), "Microfone deve ser permitido para self");
  assert.ok(permissionsPolicy.includes("camera=()"), "Câmera deve estar desativada");
  assert.ok(permissionsPolicy.includes("geolocation=()"), "Geolocalização deve estar desativada");
});

test("health route code contract prevents leaking user emails and confidential keys", () => {
  const healthCode = fs.readFileSync(path.resolve("src/app/api/health/route.ts"), "utf8");

  assert.ok(!healthCode.includes("dbUsers: usersData"), "Não pode expor dbUsers com emails de alunos");
  assert.ok(!healthCode.includes("urlSnippet"), "Não pode vazar snippet da URL");
  assert.ok(!healthCode.includes("anonKeySnippet"), "Não pode vazar snippet da chave de acesso");
  assert.ok(healthCode.includes("count: \"exact\", head: true"), "Deve usar contagem rápida de cabeçalho");
});

test("auth listAllUsers strips password_hash and reset tokens", () => {
  const authCode = fs.readFileSync(path.resolve("src/lib/auth.ts"), "utf8");

  // Garante que o listAllUsers limpa hashes tanto no Supabase quanto em memória
  assert.ok(authCode.includes("password_hash, password_reset_token_hash, ...safe"), "Deve remover password_hash e token hash dos registros");
});

test("speech route has strict 12s timeout and queue concurrency control", () => {
  const speechCode = fs.readFileSync(path.resolve("src/app/api/speech/route.ts"), "utf8");

  assert.ok(speechCode.includes("AbortSignal.timeout(12000)"), "Deve ter AbortSignal.timeout de 12 segundos");
  assert.ok(speechCode.includes("acquireUserQueueSlot"), "Deve ter controle de concorrência por usuário");
});

test("auth endpoints have public rate limiting against brute force and email flooding", () => {
  const loginCode = fs.readFileSync(path.resolve("src/app/api/auth/login/route.ts"), "utf8");
  const registerCode = fs.readFileSync(path.resolve("src/app/api/auth/register/route.ts"), "utf8");
  const verifyCode = fs.readFileSync(path.resolve("src/app/api/auth/verify/route.ts"), "utf8");
  const resendCode = fs.readFileSync(path.resolve("src/app/api/auth/resend-code/route.ts"), "utf8");
  const forgotCode = fs.readFileSync(path.resolve("src/app/api/auth/forgot-password/route.ts"), "utf8");

  assert.ok(loginCode.includes("checkPublicRateLimit"), "Login deve ter checkPublicRateLimit");
  assert.ok(registerCode.includes("checkPublicRateLimit"), "Register deve ter checkPublicRateLimit");
  assert.ok(verifyCode.includes("checkPublicRateLimit"), "Verify deve ter checkPublicRateLimit");
  assert.ok(resendCode.includes("checkPublicRateLimit"), "Resend-code deve ter checkPublicRateLimit");
  assert.ok(forgotCode.includes("checkPublicRateLimit"), "Forgot-password deve ter checkPublicRateLimit");
});

test("profile route enforces defensive clamping on telemetry and string lengths", () => {
  const profileCode = fs.readFileSync(path.resolve("src/app/api/profile/route.ts"), "utf8");

  assert.ok(profileCode.includes("Math.min(7200"), "addPracticeSeconds deve ser limitado defensivamente a no máximo 7200s");
  assert.ok(profileCode.includes("Math.min(1000"), "addXp deve ser limitado defensivamente a no máximo 1000 XP por chamada");
  assert.ok(profileCode.includes("slice(0, 50)"), "nickname deve ter tamanho máximo delimitado");
});

test("global-error.tsx exists as root error boundary", () => {
  assert.ok(fs.existsSync(path.resolve("src/app/global-error.tsx")), "global-error.tsx deve existir na raiz de src/app");
});
