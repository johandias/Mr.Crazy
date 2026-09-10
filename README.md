# Mr.Crazy

Mr.Crazy e um SaaS premium de aprendizagem de ingles com IA conversacional, desenhado para ajudar brasileiros a desenvolver fala e escuta por meio de pratica oral ativa, feedback adaptativo, repeticao espacada e um personagem 3D que reage aos erros do usuario.

## Rodar Localmente

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:3000/practice`.

## Chave de Teste

A chave enviada foi configurada em `.env.local` como `MRCRAZY_TEST_KEY`. Esse arquivo fica ignorado pelo Git. Para analise online em tempo real, o backend procura `GEMINI_API_KEY`, `GOOGLE_API_KEY` ou `MRCRAZY_TEST_KEY`, sem expor o valor para o navegador. Se a API falhar, o simulador local assume a correcao.

## Voz em tempo real

Com `OPENAI_API_KEY`, o site abre uma conversa de voz bidirecional por WebRTC com `gpt-realtime-2.1-mini`, voz `ballad`, transcrição `gpt-realtime-whisper`, redução de ruído `far_field` e detecção automática de turnos. O usuário fala sem apertar botões; o controle manual e a síntese do navegador continuam disponíveis como contingência.

O nível escolhido na interface (básico, intermediário ou avançado) e o tema da sessão são enviados ao tutor sempre que uma nova conversa é aberta. O fallback de fala usa `gpt-4o-mini-tts` com a mesma voz `ballad`.

## Acesso

O app protege as rotas com cookie de sessao HTTP-only. Em producao, configure `MRCRAZY_AUTH_USER`, `MRCRAZY_AUTH_PASSWORD` e `MRCRAZY_AUTH_SECRET` na Vercel. Sem `MRCRAZY_AUTH_PASSWORD`, nenhum login e aceito.

## Rotas

- `/` e `/practice`: experiencia principal de conversa com Mr.Crazy.
- `/login`: tela de acesso.
- `/onboarding`: apresentacao curta do personagem.
- `/progress`: metricas de aprendizado.
- `/history`: historico de sessoes.
- `/settings`: configuracoes de voz, intensidade e acessibilidade.

## Documentacao

- [Intuito do produto](docs/INTUITO.md)
