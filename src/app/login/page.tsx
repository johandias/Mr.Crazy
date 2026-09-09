import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="simple-page">
      <section className="simple-panel auth-panel">
        <p className="eyebrow">Mr.Crazy Access</p>
        <h1>Entre para treinar ingles antes que ele perca a paciencia.</h1>
        <label>
          Email
          <input type="email" placeholder="voce@empresa.com" />
        </label>
        <label>
          Senha
          <input type="password" placeholder="••••••••" />
        </label>
        <Link className="primary-link" href="/onboarding">
          <Mail size={18} />
          Entrar
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
