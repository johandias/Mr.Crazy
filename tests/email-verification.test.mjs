import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import {
  registerNewUser,
  verifyUserEmailCode,
  regenerateVerificationCode,
  updateUserApprovalStatus,
  findUserByEmail,
  createPasswordResetToken,
  resetPasswordWithToken,
  changeUserPassword,
  verifyPassword
} from "../src/lib/auth.ts";
import {
  buildPasswordResetEmailContent,
  buildVerificationEmailContent,
  sendVerificationEmail
} from "../src/lib/email.ts";

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

test("password reset email is dark, uses a reset URL, and avoids exposing raw tokens outside the link", () => {
  const resetUrl = "https://www.mrcrazy.fun/reset-password?email=novo.aluno%40example.com&token=secret-token";
  const content = buildPasswordResetEmailContent({
    email: "novo.aluno@example.com",
    nickname: "Novo Aluno",
    resetUrl
  });

  assert.match(content.subject, /Redefina sua senha/, "Subject must describe password reset");
  assert.match(content.html, /REDEFINIR SENHA/, "Reset CTA must be obvious");
  assert.match(content.html, /reset-password\?email=novo\.aluno%40example\.com&amp;token=secret-token/, "Reset URL must be preserved in HTML");
  assert.match(content.text, /reset-password\?email=novo\.aluno%40example\.com&token=secret-token/, "Reset URL must be preserved in text fallback");
  assert.match(content.html, /#05080d/i, "Password reset email must keep the dark Mr.Crazy identity");
});

test("password reset token flow stores only token hash and consumes the link once", async () => {
  const testEmail = `student-reset-${Date.now()}@test.com`;
  const regResult = await registerNewUser(
    testEmail,
    "senhaAntiga99",
    "Aluno Reset",
    26,
    "masculino"
  );

  assert.ok(regResult.verificationCode);
  const approved = await verifyUserEmailCode(testEmail, regResult.verificationCode);
  assert.equal(approved.success, true);

  const reset = await createPasswordResetToken(testEmail);
  assert.equal(reset.success, true);
  assert.ok(reset.token);
  assert.ok(reset.user?.password_reset_token_hash);
  assert.notEqual(reset.user?.password_reset_token_hash, reset.token, "Raw reset token must never be stored");

  const changed = await resetPasswordWithToken(testEmail, reset.token, "senhaNova99");
  assert.equal(changed.success, true);

  const updatedUser = await findUserByEmail(testEmail);
  assert.ok(updatedUser?.password_hash);
  assert.equal(verifyPassword("senhaNova99", updatedUser.password_hash), true);

  const reuse = await resetPasswordWithToken(testEmail, reset.token, "outraSenha99");
  assert.equal(reuse.success, false, "Reset link must be single-use");
});

test("authenticated password change requires current password", async () => {
  const testEmail = `student-change-${Date.now()}@test.com`;
  const regResult = await registerNewUser(
    testEmail,
    "senhaAtual99",
    "Aluno Troca",
    31,
    "outro"
  );

  assert.ok(regResult.verificationCode);
  await verifyUserEmailCode(testEmail, regResult.verificationCode);

  const wrong = await changeUserPassword(regResult.user.id, "errada", "senhaNova88", testEmail);
  assert.equal(wrong.success, false);

  const ok = await changeUserPassword(regResult.user.id, "senhaAtual99", "senhaNova88", testEmail);
  assert.equal(ok.success, true);

  const updatedUser = await findUserByEmail(testEmail);
  assert.ok(updatedUser?.password_hash);
  assert.equal(verifyPassword("senhaNova88", updatedUser.password_hash), true);
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
  assert.ok(loginCode.includes("regenerateVerificationCode"), "Pending login must refresh the verification code");
  assert.ok(loginCode.includes("sendVerificationEmail"), "Pending login must resend the confirmation email");
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
  assert.ok(formCode.includes("/api/auth/forgot-password"), "Must allow requesting password recovery");
  assert.ok(formCode.includes("Esqueci minha senha"), "Must expose forgot password option");
  assert.ok(formCode.includes("maxLength={6}"), "Must have 6-digit input");
  assert.ok(
    !formCode.includes("Esperando Liberação do Administrador"),
    "Must not show admin waiting banner to student"
  );
});

test("password reset route and settings contracts are wired", () => {
  const forgotRoute = fs.readFileSync("src/app/api/auth/forgot-password/route.ts", "utf-8");
  const confirmRoute = fs.readFileSync("src/app/api/auth/reset-password/confirm/route.ts", "utf-8");
  const changeRoute = fs.readFileSync("src/app/api/auth/change-password/route.ts", "utf-8");
  const resetPage = fs.readFileSync("src/components/ResetPasswordForm.tsx", "utf-8");
  const settingsCode = fs.readFileSync("src/components/ProfileSettingsForm.tsx", "utf-8");
  const migration = fs.readFileSync("supabase/migrations/202609300001_password_reset_tokens.sql", "utf-8");

  assert.ok(forgotRoute.includes("createPasswordResetToken"), "Forgot route must create reset token");
  assert.ok(forgotRoute.includes("sendPasswordResetEmail"), "Forgot route must send reset email");
  assert.ok(confirmRoute.includes("resetPasswordWithToken"), "Reset route must consume reset token");
  assert.ok(changeRoute.includes("changeUserPassword"), "Settings route must change authenticated password");
  assert.ok(resetPage.includes("/api/auth/reset-password/confirm"), "Reset page must call reset confirmation API");
  assert.ok(settingsCode.includes("/api/auth/change-password"), "Settings must expose password change inside app");
  assert.ok(migration.includes("password_reset_token_hash"), "Migration must add token hash column");
  assert.ok(migration.includes("WHERE password_reset_token_hash IS NOT NULL"), "Migration must use partial index for reset tokens");
});
