import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { redirectAuthenticated } from "@/lib/server-auth";

export default async function LoginPage() {
  await redirectAuthenticated();

  return (
    <main className="simple-page">
      <section className="simple-panel auth-panel">
        <p className="eyebrow">Acesso Mr.Crazy</p>
        <h1>Entre antes que ele perca a paciência.</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
