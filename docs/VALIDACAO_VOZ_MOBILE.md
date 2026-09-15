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
reproducao do professor o envio de audio e temporariamente silenciado para evitar eco,
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

## Revisao de 15/09/2026

- Corrigidos dois overrides de CSS que removiam o recuo superior: cabecalho com
  padding fixo e `.practice-main` com padding de 6 px marcado como `!important`.
  Cabecalho e pratica agora somam margem ao inset. Uma faixa opaca protege a area
  da hora durante a rolagem. Novas aberturas do PWA usam status bar nao translucida.
- Removido o temporizador vazio de resposta. Se o servidor confirmar o audio
  (`input_audio_buffer.committed`) mas nao iniciar resposta em 1,5 s, o cliente
  solicita uma resposta. O evento `response.created` cancela essa recuperacao;
  transcricoes atrasadas nao controlam o turno nem mudam o estado para escuta.
- A fonte do microfone fica ativa durante a reproducao; apenas a faixa enviada
  e silenciada. Mute e segundo plano continuam suspendendo a captura. O elemento
  de audio agora fica no DOM e e removido ao encerrar a sessao.
- Conexao encerrada atualiza o botao para desligado. Durante a conexao o botao
  fica desabilitado para impedir cancelamentos acidentais por toques repetidos.
- A negociacao espera ate 1,5 s pelos candidatos ICE, em vez de apenas 60 ms.
- Testes: 12 testes do cliente Realtime passaram, alem do typecheck e build.
  Playwright em 320, 390 e 430 px, inset superior simulado de 59 px: conteudo
  comeca em 71 px, sem overflow horizontal; sem inset, comeca em 12 px.
  WebRTC nativo entre dois peers transmitiu mais de 10 KB de audio sintetico;
  recuperacao gerou uma unica resposta simulada, retomou a escuta e preservou mute.
- Continua sem validacao da chamada real OpenAI ou microfone fisico do iPhone:
  nao ha chave local e a conexao Vercel disponivel nao concedeu acesso ao projeto.
