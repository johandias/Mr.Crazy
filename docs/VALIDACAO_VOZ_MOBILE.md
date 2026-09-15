# Voz e telas de celular

## Fluxo de voz

A conversa usa WebRTC para transmitir audio diretamente ao modelo Realtime da
OpenAI. A captura solicita cancelamento de eco, supressao de ruido, ajuste de ganho
e um canal mono, sem exigir um dispositivo especifico.

O servidor detecta silencio (server_vad, 900 ms) e cria a resposta automaticamente.
A transcricao serve para exibir o que foi dito; a resposta nao espera esse evento,
que pode chegar depois do inicio da fala do professor. O idioma nao e fixado em
ingles: o aluno pode falar portugues brasileiro ou ingles americano.

O botao de microfone conecta no primeiro toque e depois alterna mute. Durante a
reproducao do professor a captura e temporariamente suspensa para evitar eco,
retornando ao fim do audio. O mute escolhido pelo aluno e preservado ao trocar de
aba. Falha, encerramento e ausencia de eventos liberam o estado de espera.

Referencias consultadas:

- [OpenAI: deteccao de turnos e respostas automaticas](https://developers.openai.com/api/docs/guides/realtime-vad).
- [OpenAI: criacao de chamadas WebRTC](https://developers.openai.com/api/reference/typescript/resources/realtime/subresources/calls/methods/create).

## Validacao realizada

- `npm run typecheck` e `npm run build`: passaram.
- 15 testes de voz passaram, incluindo seis regressao do cliente Realtime:
  transcricao atrasada, resposta sem audio/falha, mute persistente, interrupcao,
  desconexao e timeout sem congelar a captura.
- Playwright: transporte WebRTC entre dois peers locais, captura de audio sintetico
  e eventos de resposta simulados. A interface exibiu a fala em portugues e a
  resposta, preservou a mensagem anterior e voltou a escutar; mute funcionou.
- Playwright: mapa e insights sem overflow da pagina em 320, 390, 430 e 1440 px;
  detalhes expansiveis e listas horizontais verificados.
- Manifesto PWA retorna 200. Removido arquivo publico duplicado que disputava a
  mesma URL com `src/app/manifest.ts` e causava erro 500.

## Limites desta verificacao

O ambiente local nao tem `OPENAI_API_KEY`. O teste de transporte usa um provedor
simulado, nao comprova a qualidade da transcricao ou da resposta da OpenAI nem a
captura fisica no iPhone. Esses pontos precisam de uma sessao real com a chave
configurada e permissao do microfone no aparelho.

A suite geral possui duas falhas preexistentes em `tests/scoring.test.mjs`
(penalidade por repeticao e vocabulario da resposta). O lint geral tambem possui
pendencias anteriores em componentes fora do fluxo de voz. Esses resultados nao
foram ocultados nem corrigidos alterando as expectativas dos testes.

## Responsividade e desempenho

`src/app/responsive.css` concentra os ajustes de celular. O mapa continua inteiramente
programatico e dividido nos componentes de `src/components/map`. O tamanho do
cenario acompanha o viewport via ResizeObserver; o zoom tem dimensoes reais de
rolagem, e o toque usa a rolagem nativa.

Insights usam resumos e trilhas horizontais com detalhes expansiveis. A navegacao
inferior reserva o safe-area-inset-bottom completo mais uma margem pequena. O
personagem evita redesenhos por cada fragmento de transcricao e movimentos de toque;
o canvas de Picture-in-Picture so anima quando essa janela esta aberta.
