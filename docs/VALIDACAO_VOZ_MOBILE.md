# Voz e telas de celular

## Captura reconstruida - 15/09/2026

O fluxo anterior foi substituido por tres modulos:

- `src/lib/voice/microphone.ts`: abre uma unica faixa de microfone por sessao,
  permite escolher a entrada, mede o sinal e libera os recursos ao encerrar.
- `src/lib/realtime-client.ts`: envia essa faixa diretamente por WebRTC para a
  OpenAI, recebe eventos e controla escuta, resposta e reproducao.
- `src/lib/voice/diagnostics.ts`: erros, etapas, identificadores e limites de tempo.

Nao ha reconhecimento de fala do navegador nem faixa persistente clonada entre
sessoes. A captura solicita cancelamento de eco, supressao de ruido, ganho
automatico e mono. Restricoes incompativeis permitem uma tentativa sem restricoes;
permissao negada e dispositivo selecionado indisponivel nao geram novas tentativas.

O primeiro toque conecta; depois, o botao apenas alterna mute. O medidor mostra
sinal real da faixa capturada, independentemente da deteccao do servidor. A interface
so informa conexao ativa depois do canal aberto E da confirmacao da sessao da API.

O servidor detecta silencio (server_vad, 900 ms) e responde automaticamente. A
transcricao nao dispara nem bloqueia a resposta. Quando o audio foi confirmado mas
nao existe resposta em 1,5 s, o cliente solicita uma unica resposta de recuperacao.
Nova fala e resposta automatica cancelam esse temporizador.

Durante a reproducao, o envio e temporariamente silenciado para evitar eco. A
escuta retorna apos o fim do audio; o mute escolhido pelo aluno e preservado.
Nao ha troca automatica para reconhecimento fixado em ingles. O prompt, voz e
configuracao de transcricao permanecem no servidor.

Permissao, oferta, API e canal possuem limites de tempo separados. Falha terminal
fecha faixa, peer, canal e elemento de audio. Permissao concedida depois de um
cancelamento tambem libera o dispositivo. Uma resposta travada por 30 s libera a
escuta e exibe erro. Queda breve de rede tem tolerancia de 6 s.

## Diagnostico

O painel abaixo do microfone permite copiar um JSON com as ultimas 30 ocorrencias:
etapa, codigo, tempo desde a tentativa e identificador. Erros da API incluem HTTP,
status/codigo do provedor e ID compartilhado com os logs do servidor. Administradores
tambem recebem mensagem sanitizada, campo recusado e modelo testado.

Na Vercel, pesquisar o ID em `OpenAI Realtime session failed` ou
`OpenAI Realtime attempt rejected`. Nao sao registrados audio, transcricoes, SDP
ou identificadores de dispositivos. Chaves e Bearer tokens sao removidos dos erros
do provedor; corpos HTML nao sao expostos.

O indicador do sistema operacional significa apenas que o dispositivo esta aberto.
Nao comprova que a API aceitou a sessao. Um medidor com sinal, seguido de erro na
etapa `api`, separa problema de configuracao/conta de um problema de captura local.

## Validacao

- Typecheck, build de producao e lint dos novos modulos/controle/rota passaram.
- 39 testes focados de captura, Realtime, rota, erros e reproducao passaram.
- Suite completa: 46 passaram e 2 falhas preexistentes em `scoring.test.mjs`
  permaneceram (penalidade por repeticao e vocabulario). Nao foram alteradas.
- Playwright: WebRTC nativo entre dois peers locais transmitiu audio sintetico.
  O medidor apresentou sinal, a fala em portugues foi exibida, houve uma unica
  resposta simulada e a escuta retornou. Mute zerou o sinal e desabilitou a faixa.
- Playwright: recusa HTTP 502/OpenAI 400 simulada exibiu campo, modelo e codigo,
  copiou diagnostico correlacionado, encerrou a faixa e reativou reconexao.
- Controle de voz sem overflow horizontal em 320, 390, 768 e 1440 px.

## Limites

Nao existe `OPENAI_API_KEY` no ambiente local. Transporte e UI foram testados com
audio sintetico e eventos de provedor simulados, nao com uma chamada real OpenAI.
A qualidade da transcricao, a permissao/modelo da conta em producao e o microfone
fisico do iPhone precisam ser verificados em uma sessao real. A causa da recusa
de producao ainda depende do erro correlacionado, nao apenas do print generico.

## Responsividade preservada

`src/app/responsive.css` mantem o recuo superior com safe-area e a margem da barra
inferior. Mapa programatico modular, insights horizontais e otimizacoes do canvas
de Picture-in-Picture das revisoes anteriores foram preservados.

## Referencias

- [OpenAI: deteccao de turnos](https://developers.openai.com/api/docs/guides/realtime-vad).
- [OpenAI: chamadas WebRTC](https://developers.openai.com/api/reference/typescript/resources/realtime/subresources/calls/methods/create).
