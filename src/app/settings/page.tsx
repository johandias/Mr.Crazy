import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <main className="secondary-main settings-main">
        <section className="secondary-hero">
          <p className="eyebrow">Configurações</p>
          <h1>Calibre o professor sem domesticar demais.</h1>
        </section>
        <form className="settings-form">
          <label>
            Voz
            <select defaultValue="young-neutral">
              <option value="young-neutral">Jovem neutra</option>
              <option value="male-expressive">Masculina expressiva</option>
              <option value="slow-clear">Mais lenta e clara</option>
            </select>
          </label>
          <label>
            Intensidade
            <select defaultValue="balanced">
              <option value="balanced">Balanceada</option>
              <option value="crazy">Crazy Mode</option>
              <option value="soft">Menos provocativa</option>
            </select>
          </label>
          <label className="toggle-row">
            <input type="checkbox" defaultChecked />
            Legendas durante a conversa
          </label>
          <label className="toggle-row">
            <input type="checkbox" />
            Modo sem áudio
          </label>
        </form>
      </main>
    </AppShell>
  );
}
