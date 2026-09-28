# Gemini Configuration & Execution Guidelines - Mr.Crazy

## Terminal & Command Execution Policy
- **Timeout Estrito de 40 Segundos**: Toda execução de comando no terminal DEVE ter um limite máximo de execução de 40 segundos.
- **Cancelamento Obrigatório**: Se qualquer processo, script ou comando no terminal não finalizar dentro de 40 segundos, ele DEVE ser finalizado imediatamente com timeout (ação de `kill`/abortar tarefa).
- **Parâmetros de Timeout**: Sempre que executar comandos de rede, requisições HTTP, builds ou testes que aceitem flags de tempo limite (como `curl`, `fetch`, `npm`, scripts de teste), passe parâmetros explícitos com limite máximo de 40 segundos (ex.: `--max-time 40`, `--timeout=40000`).
- **Comandos em Segundo Plano (Background)**: Tarefas enviadas em segundo plano que excederem 40 segundos sem concluir devem ser terminadas imediatamente.
