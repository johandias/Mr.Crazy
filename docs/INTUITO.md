# Intuito do Produto

Fonte de referencia: documento compartilhado no Gemini, "Metodologia de Aplicativo de Ingles com IA". Acesso em 2026-09-09.

## Visao Geral

O objetivo do Mr.Crazy e ser um aplicativo de ingles com IA conversacional voltado principalmente para brasileiros que querem aprender a conversar com mais fluidez. A proposta nao e substituir estudo formal por conteudo passivo, mas transformar conhecimento reconhecido pelo aluno em fala ativa, rapida e funcional.

O documento defende que ouvir e ler conteudo compreensivel ajuda, mas nao basta para gerar automaticidade oral. Para conversar bem, o usuario precisa falar desde o inicio, recuperar vocabulario de memoria, receber feedback no momento certo e praticar em situacoes parecidas com as do mundo real.

## Problema que o Produto Resolve

Muitos brasileiros sabem regras, traduzem frases mentalmente e reconhecem vocabulario, mas travam quando precisam falar. O produto ataca esse bloqueio por tres frentes:

- transformar vocabulario passivo em vocabulario ativo;
- reduzir a traducao mental por meio de respostas orais sob pressao leve de tempo;
- corrigir pontos que realmente atrapalham a inteligibilidade, sem perseguir sotaque nativo perfeito.

## Publico-Alvo

O foco inicial sao falantes nativos de Portugues Brasileiro que desejam ganhar competencia oral em ingles. O produto deve atender desde iniciantes ate usuarios avancados, ajustando idioma de apoio, velocidade, contexto, tipo de correcao e complexidade das tarefas.

## Tese Pedagogica Central

A experiencia deve priorizar producao oral ativa, nao consumo passivo. O usuario precisa falar na maior parte da sessao, idealmente pelo menos 65% do tempo de audio.

Os pilares pedagogicos sao:

- Pushed Output: o aluno e levado a formular respostas proprias em voz alta.
- Retrieval Practice: o sistema exige recuperacao ativa de palavras, chunks e estruturas.
- Spaced Repetition Conversacional: itens importantes reaparecem naturalmente em dialogos futuros.
- Feedback Adaptativo: erros sao corrigidos conforme impacto, momento e carga cognitiva.
- Lingua Franca Core: pronuncia e avaliada por inteligibilidade internacional, nao por imitacao de nativos.
- Scaffolding em L1: o portugues apoia iniciantes e desaparece gradualmente.

## Prioridades para Brasileiros

O documento destaca interferencias comuns do Portugues Brasileiro que devem orientar o motor pedagogico:

- epentese vocalica, como adicionar um som de "i" ao final de palavras: `drink-i`, `hot-i`, `dog-i`;
- pronuncia indevida do passado regular com `-ed`, como `played-i` ou `talk-id`;
- dificuldade em distinguir vogais longas e curtas, como `sheep` vs. `ship`;
- ritmo silabico do portugues aplicado ao ingles, prejudicando reducao vocalica e acento frasal;
- falsos cognatos criticos, como `pretend` usado no sentido de "pretender";
- erros estruturais recorrentes, como falta de sujeito em `It is raining` ou perguntas sem auxiliar.

A correcao deve ser proporcional ao impacto: erros que quebram entendimento recebem intervencao imediata; erros cosmeticos ou de baixa relevancia podem ser ignorados nos niveis iniciais.

## Experiencia de Sessao

A sessao recomendada tem cerca de 15 minutos e segue um arco simples:

1. Abertura e acolhimento, com audio bidirecional e retomada do historico do usuario.
2. Recuperacao ativa, com perguntas que fazem o aluno buscar itens agendados.
3. Tarefa conversacional principal, baseada em situacoes reais como entrevista, viagem, rotina ou trabalho.
4. Disparo rapido, com perguntas curtas e limite de resposta para reduzir traducao mental.
5. Fechamento, com painel pos-sessao mostrando desempenho, pontos de pronuncia e itens consolidados.

## Arquitetura Conceitual

O produto precisa de uma camada pedagogica acima do modelo de linguagem. Um LLM generico sozinho tende a entender frases ruins demais e pode mascarar problemas do aluno.

Componentes esperados:

- captura de audio e ASR em modo literal, preservando erros e hesitacoes;
- avaliador fonetico focado em inteligibilidade;
- orquestrador pedagogico para decidir quando corrigir, tolerar ou provocar auto-reparo;
- modelo de competencia do aluno, com historico de temas, estruturas, latencia e pronuncia;
- fila de repeticao espacada invisivel dentro das conversas;
- modulador de idioma para reduzir gradualmente o uso de portugues;
- relatorio pos-turno com metricas objetivas de progresso.

## Metricas de Aprendizado

O sucesso do produto deve ser medido por sinais reais de competencia oral, nao por indicadores cosmeticos. Metricas importantes:

- tempo de fala ativa do usuario;
- latencia media de resposta;
- tamanho medio dos enunciados;
- taxa de auto-correcao;
- reducao de erros criticos de pronuncia;
- retencao de chunks e estruturas apos dias ou semanas;
- capacidade de concluir tarefas reais em ingles.

## MVP Recomendado

O MVP deve provar o nucleo do produto:

- conversa por voz em tempo real;
- sessoes curtas de pratica oral;
- diagnostico adaptativo leve, sem teste inicial punitivo;
- correcao de epentese vocalica e `-ed`;
- prompts de auto-reparo para erros criticos;
- repeticao espacada embutida no dialogo;
- painel simples de progresso apos a sessao.

Funcionalidades como gamificacao pesada, ranking social, avatar complexo e excesso de conteudo teorico podem ficar para depois.

## O Que Evitar

O documento e explicito sobre armadilhas de produto:

- exercicios de multipla escolha como mecanica central;
- IA falando demais e aluno ouvindo passivamente;
- interrupcoes constantes no meio da fala;
- busca por sotaque nativo perfeito;
- persona sarcastica ou agressiva como padrao;
- dependencia de LLM sem camada pedagogica;
- latencia alta entre turno do usuario e resposta da IA;
- testes longos de nivelamento antes da primeira fala;
- imersao total em ingles para iniciantes absolutos;
- medir progresso por XP, streaks ou badges em vez de habilidade oral real.

## Riscos e Cuidados

Alguns riscos precisam ser tratados desde o desenho:

- a IA pode compreender demais e deixar passar fala pouco inteligivel;
- ruido ambiente pode gerar diagnosticos falsos de pronuncia;
- conforto com IA nao garante confianca com humanos;
- humor provocativo pode motivar alguns usuarios, mas aumentar abandono em outros;
- feedback excessivo pode paralisar a fluencia.

## Direcao de Produto

Mr.Crazy deve ser construido como um treinador oral adaptativo: acolhedor, exigente na medida certa e obcecado por fazer o usuario falar. O diferencial nao esta em "ensinar ingles" de forma generica, mas em criar uma rotina diaria de conversa guiada que transforma pratica deliberada em fluencia funcional.
