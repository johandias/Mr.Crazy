import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="simple-page">
      <section className="simple-panel auth-panel">
        <p className="eyebrow">Recuperação Mr.Crazy</p>
        <h1>Crie uma senha nova e volte ao treino.</h1>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
