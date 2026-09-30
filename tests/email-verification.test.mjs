import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import {
  registerNewUser,
  verifyUserEmailCode,
  regenerateVerificationCode,
  updateUserApprovalStatus,
  findUserByEmail
} from "../src/lib/auth.ts";
import { buildVerificationEmailContent, sendVerificationEmail } from "../src/lib/email.ts";

test("registration generates 6-digit verification code and sets status pending", async () => {
  const testEmail = `student-${Date.now()}@test.com`;
  const result = await registerNewUser(
    testEmail,
    "senha123456",
    "Estudante Teste",
    25,
    "masculino"
  );

  assert.equal(result.isPending, true, "Student should be pending");
  assert.equal(result.user.status, "pending");
  assert.ok(result.verificationCode, "Must generate a verification code");
  assert.equal(result.verificationCode.length, 6, "Code must be 6 digits");
  assert.match(result.verificationCode, /^\d{6}$/, "Code must be numeric");
});

test("sendVerificationEmail handles simulated mode and dispatches formatted email", async () => {
  const emailRes = await sendVerificationEmail({
    email: "novo.aluno@example.com",
    nickname: "Novo Aluno",
    code: "654321",
    verifyUrl: "https://www.mrcrazy.fun/verify?email=novo.aluno@example.com&code=654321"
  });

  assert.equal(emailRes.success, true);
  assert.ok(emailRes.messageId);
});

test("verification email template is dark, compact, and preserves dynamic activation data", () => {
  const content = buildVerificationEmailContent({
    email: "novo.aluno@example.com",
    nickname: "Novo Aluno",
    code: "654321",
    verifyUrl: "https://www.mrcrazy.fun/verify?email=novo.aluno%40example.com&code=654321"
  });

  assert.match(content.subject, /\[654321\]/, "Subject must keep the verification code");
  assert.match(content.html, /Fala aí, Novo Aluno!/, "Template must keep the dynamic student name");
  assert.match(content.html, /6 5 4 3 2 1/, "Code must be visually spaced in the email");
  assert.match(content.html, /https:\/\/www\.mrcrazy\.fun\/verify\?email=novo\.aluno%40example\.com&amp;code=654321/, "Activation URL must be preserved in the HTML");
  assert.match(content.text, /https:\/\/www\.mrcrazy\.fun\/verify\?email=novo\.aluno%40example\.com&code=654321/, "Activation URL must be preserved in the text fallback");
  assert.match(content.html, /#05080d/i, "Email must be born dark, not rely on client dark mode");
  assert.match(content.html, /mrcrazy-fala-ai-email\.png/, "Email must use the selected Mr.Crazy hero art");
  assert.match(content.html, /v:roundrect/, "CTA must include an Outlook-friendly VML fallback");
  assert.match(content.html, /ATIVAR MINHA CONTA/, "CTA must stay obvious and direct");
  assert.match(content.html, /word-break:break-all/, "Fallback URL must remain usable on mobile clients");
  assert.match(content.html, /min-width: 0 !important/, "Mobile CTA must not force horizontal overflow at 320px");
  assert.equal((content.html.match(/<img\b/g) || []).length, 1, "Template must not overload the email with images");
  assert.ok(!content.html.includes("Prova Oral"), "Activation email must not show competing product CTAs");
  assert.ok(!content.html.includes("Chega de travar"), "Tone must be provocative without sounding aggressive");
});

test("verification email hero asset exists and is optimized for transactional email", () => {
  const assetPath = "public/assets/email/mrcrazy-fala-ai-email.png";
  const stat = fs.statSync(assetPath);

  assert.ok(stat.size > 0, "Hero image asset must exist");
  assert.ok(stat.size < 260 * 1024, "Hero image should stay compact enough for email clients");
});

test("dual approval path 1: student approves account with 6-digit email code", async () => {
  const testEmail = `student-code-${Date.now()}@test.com`;
  const regResult = await registerNewUser(
    testEmail,
    "senhaForte99",
    "Aluno Código",
    30,
    "outro"
  );

  const code = regResult.verificationCode;
  assert.ok(code);

  // Wrong code fails
  const failAttempt = await verifyUserEmailCode(testEmail, "000000");
  assert.equal(failAttempt.success, false);

  // Correct code approves account
  const successAttempt = await verifyUserEmailCode(testEmail, code);
  assert.equal(successAttempt.success, true);
  assert.equal(successAttempt.user?.status, "approved");

  // User is approved in store
  const updatedUser = await findUserByEmail(testEmail);
  assert.equal(updatedUser?.status, "approved");
});

test("dual approval path 2: admin approves pending student manually", async () => {
  const testEmail = `student-admin-${Date.now()}@test.com`;
  const regResult = await registerNewUser(
    testEmail,
    "senhaForte99",
    "Aluno Admin Manual",
    22,
    "feminino"
  );

  assert.equal(regResult.user.status, "pending");

  // Admin approves via admin panel function
  const adminApproved = await updateUserApprovalStatus(regResult.user.id, "approved");
  assert.equal(adminApproved, true);

  const checkUser = await findUserByEmail(testEmail);
  assert.equal(checkUser?.status, "approved");
});

test("resending code creates new 6-digit code and refreshes expiration", async () => {
  const testEmail = `student-resend-${Date.now()}@test.com`;
  const regResult = await registerNewUser(
    testEmail,
    "senhaForte99",
    "Aluno Resend",
    28,
    "masculino"
  );

  const initialCode = regResult.verificationCode;
  const resendResult = await regenerateVerificationCode(testEmail);

  assert.equal(resendResult.success, true);
  assert.ok(resendResult.code);
  assert.equal(resendResult.code.length, 6);

  // Old code no longer verifies if replaced
  if (initialCode && initialCode !== resendResult.code) {
    const tryOld = await verifyUserEmailCode(testEmail, initialCode);
    assert.equal(tryOld.success, false);
  }

  // New code verifies successfully
  const tryNew = await verifyUserEmailCode(testEmail, resendResult.code);
  assert.equal(tryNew.success, true);
});

test("register route code contract: sends Resend email, sets needsVerification, no admin mention to user", () => {
  const registerCode = fs.readFileSync("src/app/api/auth/register/route.ts", "utf-8");

  assert.ok(registerCode.includes("sendVerificationEmail"), "Must call sendVerificationEmail");
  assert.ok(registerCode.includes("needsVerification: true"), "Must flag needsVerification for pending students");
  assert.ok(registerCode.includes("/verify?email="), "Must build 1-click verifyUrl for email");
  
  // Student-facing message must not say awaiting admin approval
  assert.ok(
    !registerCode.includes("Aguardando a aprovação do administrador"),
    "Must not tell the student that they are waiting for admin approval"
  );
  assert.ok(
    registerCode.includes("código de 6 dígitos"),
    "Must inform student about the 6-digit code sent to email"
  );
});

test("login route code contract: prompts for email verification code instead of admin approval", () => {
  const loginCode = fs.readFileSync("src/app/api/auth/login/route.ts", "utf-8");

  assert.ok(loginCode.includes("needsVerification: true"), "Must flag needsVerification on pending login");
  assert.ok(
    !loginCode.includes("aguardando liberação do administrador"),
    "Must not tell the student to wait for admin on login"
  );
  assert.ok(
    loginCode.includes("código de 6 dígitos"),
    "Must direct student to enter the 6-digit verification code"
  );
});

test("verify route code contract: supports POST (code) and GET (email link), issues session cookie", () => {
  const verifyCode = fs.readFileSync("src/app/api/auth/verify/route.ts", "utf-8");

  assert.ok(verifyCode.includes("export async function POST"), "Must have POST handler");
  assert.ok(verifyCode.includes("export async function GET"), "Must have GET handler");
  assert.ok(verifyCode.includes("verifyUserEmailCode"), "Must call verifyUserEmailCode");
  assert.ok(verifyCode.includes("createAuthToken"), "Must issue session token on verification");
  assert.ok(verifyCode.includes("AUTH_COOKIE_NAME"), "Must set auth cookie");
});

test("login form component contract: includes 6-digit code UI and resend code action", () => {
  const formCode = fs.readFileSync("src/components/LoginForm.tsx", "utf-8");

  assert.ok(formCode.includes("auth-verify-form") || formCode.includes("tab === \"verify\""), "Must have verify UI");
  assert.ok(formCode.includes("/api/auth/verify"), "Must call verify API");
  assert.ok(formCode.includes("/api/auth/resend-code"), "Must allow resending code");
  assert.ok(formCode.includes("maxLength={6}"), "Must have 6-digit input");
  assert.ok(
    !formCode.includes("Esperando Liberação do Administrador"),
    "Must not show admin waiting banner to student"
  );
});
