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
