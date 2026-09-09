# Mr.Crazy

Mr.Crazy e um SaaS premium de aprendizagem de ingles com IA conversacional, desenhado para ajudar brasileiros a desenvolver fala e escuta por meio de pratica oral ativa, feedback adaptativo, repeticao espacada e um personagem 3D que reage aos erros do usuario.

## Rodar Localmente

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:3000/practice`.

## Chave de Teste

A chave enviada foi configurada em `.env.local` como `MRCRAZY_TEST_KEY`. Esse arquivo fica ignorado pelo Git. O backend usa a variavel para ativar o provedor de teste, sem expor o valor para o navegador.

## Rotas

- `/` e `/practice`: experiencia principal de conversa com Mr.Crazy.
- `/login`: tela de acesso.
- `/onboarding`: apresentacao curta do personagem.
- `/progress`: metricas de aprendizado.
- `/history`: historico de sessoes.
- `/settings`: configuracoes de voz, intensidade e acessibilidade.

## Documentacao

- [Intuito do produto](docs/INTUITO.md)
