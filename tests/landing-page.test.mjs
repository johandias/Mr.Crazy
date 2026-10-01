import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("landing intro audio file exists in public directory and has non-zero size", () => {
  const audioPath = "public/assets/audio/mrcrazy-landing-intro.mp3";
  assert.ok(fs.existsSync(audioPath), "O arquivo de áudio de introdução deve existir em public/assets/audio/");
  const stat = fs.statSync(audioPath);
  assert.ok(stat.size > 100_000, "O arquivo de áudio deve ter tamanho válido (> 100KB)");
});

test("root page preserves standard login/auth portal and convite route renders LandingPage", () => {
  const rootPageCode = fs.readFileSync("src/app/page.tsx", "utf-8");
  assert.ok(rootPageCode.includes('requireAuth("/")'), "src/app/page.tsx deve manter requireAuth(\"/\") direcionando visitantes para o login");

  const convitePageCode = fs.readFileSync("src/app/convite/page.tsx", "utf-8");
  assert.ok(convitePageCode.includes("LandingPage"), "src/app/convite/page.tsx deve renderizar o componente LandingPage");
  assert.ok(convitePageCode.includes("getCurrentSession"), "src/app/convite/page.tsx deve inspecionar a sessão ativa");
  assert.ok(convitePageCode.includes("getCurrentUser"), "src/app/convite/page.tsx deve carregar o usuário autenticado");

  assert.ok(fs.existsSync("src/app/invite/page.tsx"), "src/app/invite/page.tsx deve existir como rota de convite");
});

test("LandingPage component includes all 10 strategic conversion sections", () => {
  const landingCode = fs.readFileSync("src/components/landing/LandingPage.tsx", "utf-8");
  
  // 1. Hero
  assert.ok(landingCode.includes("Pare de travar no inglês"), "Hero deve conter a headline de alto impacto");
  assert.ok(landingCode.includes("Mr. Crazy"), "Hero deve destacar o Mr. Crazy");
  assert.ok(landingCode.includes("Destravar Meu Inglês Agora"), "Hero deve conter CTA principal");
  
  // 2. Benefício Central
  assert.ok(landingCode.includes("Você não precisa de mais 5 anos de gramática"), "Deve conter benefício central");
  assert.ok(landingCode.includes("O Bloqueio do Silêncio"), "Deve abordar a dor do bloqueio");
  
  // 3. Como funciona
  assert.ok(landingCode.includes("Como o Mr. Crazy destrava sua fala em 4 passos"), "Deve conter os 4 passos");
  
  // 4. Seção especial do Mr. Crazy
  assert.ok(landingCode.includes("MrCrazyAudioShowcase"), "Deve embutir o showcase de áudio do Mr. Crazy");
  
  // 5. Comparativo
  assert.ok(landingCode.includes("Cursinho Tradicional vs. Mr. Crazy"), "Deve conter comparativo lado a lado");
  
  // 6. Demonstração interativa
  assert.ok(landingCode.includes("LandingInteractiveDemo"), "Deve embutir as abas interativas do produto");
  
  // 7. Objeções
  assert.ok(landingCode.includes("Eu sou iniciante do zero"), "Deve responder à objeção de iniciantes");
  assert.ok(landingCode.includes("Regra dos 70%"), "Deve destacar a tolerância a sotaque brasileiro");
  
  // 8. FAQ
  assert.ok(landingCode.includes("LandingFaq"), "Deve embutir o acordeão de FAQ");
  
  // 9. Sticky mobile bar
  assert.ok(landingCode.includes("landing-sticky-bar"), "Deve conter a barra de conversão mobile fixa");
  
  // 10. Links e CTAs
  assert.ok(landingCode.includes("/login"), "Deve ter links para o fluxo de cadastro/login");
  assert.ok(landingCode.includes("/practice"), "Deve apontar para a sala de treino");
});

test("MrCrazyAudioShowcase component has synchronized karaoke subtitles, autoplay on scroll entry, and no big play button", () => {
  const showcaseCode = fs.readFileSync("src/components/landing/MrCrazyAudioShowcase.tsx", "utf-8");
  
  assert.ok(showcaseCode.includes("/assets/audio/mrcrazy-landing-intro.mp3"), "Deve carregar o áudio real gravado");
  assert.ok(showcaseCode.includes("RpgCharacter"), "Deve animar o RpgCharacter");
  assert.ok(showcaseCode.includes("Fala aí! Eu sou o Mr. Crazy"), "Deve conter a primeira frase transcrita");
  assert.ok(showcaseCode.includes("Então, bora começar!"), "Deve conter a frase final transcrita");
  assert.ok(showcaseCode.includes("createAnalyser"), "Deve usar Web Audio API AnalyserNode para boca e ondas");
  assert.ok(showcaseCode.includes("landing-wave-bar"), "Deve renderizar barras do equalizador sonoro");
  assert.ok(showcaseCode.includes("IntersectionObserver"), "Deve iniciar automaticamente ao rolar para o Mr. Crazy via IntersectionObserver");
  assert.ok(!showcaseCode.includes("landing-player-play-btn"), "Não deve ter o botão grande de Play para iniciar");

  const landingCss = fs.readFileSync("src/app/landing.css", "utf-8");
  assert.ok(landingCss.includes("mr-crazy-hand-gesture"), "Deve conter animação de gesticulação de mãos do Mr. Crazy");
  assert.ok(landingCss.includes("mr-crazy-thumb-talk"), "Deve conter animação para gesto de joinha falando");
  assert.ok(landingCss.includes("mr-crazy-finger-talk"), "Deve conter animação para bronca falando");
});

test("layout metadata includes Open Graph and Twitter Card for WhatsApp sharing", () => {
  const layoutCode = fs.readFileSync("src/app/layout.tsx", "utf-8");
  
  assert.ok(layoutCode.includes("metadataBase"), "Layout deve ter metadataBase configurada");
  assert.ok(layoutCode.includes("openGraph"), "Layout deve ter openGraph");
  assert.ok(layoutCode.includes("twitter"), "Layout deve ter twitter card");
  assert.ok(layoutCode.includes("mrcrazy-fala-ai-email.png"), "Deve ter imagem de prévia de alta qualidade");
});

test("desktop widescreen optimizations take advantage of larger displays while preserving mobile compactness", () => {
  const landingCss = fs.readFileSync("src/app/landing.css", "utf-8");
  
  // 1. Studio layout 3-zone grid for Mr. Crazy
  assert.ok(landingCss.includes(".mr-crazy-showcase-stage-grid"), "Deve conter grid para o palco de estúdio no desktop");
  assert.ok(landingCss.includes(".mr-crazy-desktop-companion"), "Deve conter painéis companheiros para widescreen");
  assert.ok(landingCss.includes("grid-template-columns: 290px 1fr 290px") || landingCss.includes("grid-template-columns: 310px 1fr 310px"), "Deve ter 3 colunas para o estúdio no desktop");
  
  // 2. Interactive Demo side-by-side split on desktop
  assert.ok(landingCss.includes(".landing-demo-grid-split"), "Deve conter grid split para abas de demonstração");
  assert.ok(landingCss.includes("1.15fr 0.85fr"), "Grid split deve ser balanceado em 2 colunas em telas maiores");
  
  // 3. Desktop expansion for container and demo window
  assert.ok(landingCss.includes("max-width: 1060px") || landingCss.includes("max-width: 1160px"), "Janela de demonstração deve expandir em telas largas");
  assert.ok(landingCss.includes("max-width: 1300px") || landingCss.includes("max-width: 1380px"), "Container da landing page deve aproveitar telas grandes");
  
  // 4. Interactive demo tabs component uses grid split
  const demoCode = fs.readFileSync("src/components/landing/LandingInteractiveDemo.tsx", "utf-8");
  assert.ok(demoCode.includes("landing-demo-grid-split"), "LandingInteractiveDemo deve utilizar landing-demo-grid-split");
  
  // 5. Showcase component includes desktop companion panels
  const showcaseCode = fs.readFileSync("src/components/landing/MrCrazyAudioShowcase.tsx", "utf-8");
  assert.ok(showcaseCode.includes("mr-crazy-showcase-stage-grid"), "Showcase deve embutir o palco de estúdio em grid");
  assert.ok(showcaseCode.includes("mr-crazy-desktop-companion"), "Showcase deve ter painéis complementares");
});

