🚀 NPS Platform MVP - Full Stack
Este projeto é uma plataforma completa de gerenciamento de Net Promoter Score (NPS), desenvolvida para unir a visão estratégica de Customer Success com o poder do desenvolvimento Full Stack.

💡 A Origem do Projeto
Inspirada pela minha trajetória em empresas de tecnologia e SaaS, identifiquei que o maior desafio na gestão de experiência do cliente não é apenas a coleta de dados, mas a execução eficiente do "fechamento do ciclo" (closed loop).

Como Analista de Sucesso do Cliente, desenvolvi este MVP para traduzir essa dor de negócio em uma solução técnica robusta. O sistema garante que nenhum feedback seja esquecido através de um workflow de governança:

Time Operacional: Registra resoluções detalhadas para as tratativas das avaliações.

Time Administrativo: Possui uma visão de funil para aprovar ou reprovar as ações tomadas, fechando o ciclo de feedback com auditoria.

🛠️ Tecnologias Utilizadas
Frontend: React, TypeScript, Material UI (MUI), Axios, React Router Dom.

Backend: Node.js, Express, Prisma ORM, JWT, Bcrypt.

<<<<<<< HEAD

- Sistema de Autenticação e Autorização: Implementação de JWT com controle de acesso granular. A interface se adapta dinamicamente ao cargo do usuário (Admin vs Operacional).
- UX Persona-Based (Funil de Aprovação): Reformulação da visão do Administrador, substituindo filtros técnicos por um Funil de Processo (Pipeline). O Admin foca no fluxo de decisão: Aguardando Operacional ➔ Pendente de Aprovação ➔ Finalizado.
- Gestão de Estados Complexos: Uso de useState e useEffect para garantir que os filtros de funil não entrem em conflito com as regras de negócio do time operacional.
- Regras de Negócio Integradas: Validação automática de status de empresa e bloqueio de feedbacks para entidades inativas.
- Painel de Indicadores Real-time: Dashboard dinâmico com cálculo de NPS Score e segmentação automática de clientes.

## 🛠️ Manutenção e Integridade de Dados (Novo!)

- Recentemente, o projeto passou por uma fase de Sustentação e Refatoração, onde implementei:
- Saneamento de Banco de Dados: Identificação e correção de inconsistências no PostgreSQL (via Neon Cloud). Realizei o tratamento de registros "órfãos" (sem vínculos de empresa/usuário) para garantir que as métricas do Dashboard fossem 100% íntegras.
- Refatoração de Código (Clean Code): Remoção de variáveis e funções obsoletas após a transição para o novo sistema de funil, reduzindo a dívida técnica e melhorando a manutenibilidade.
- # Otimização de Deploy: Configuração de rotas na Vercel via vercel.json para suporte a Client-side Routing, garantindo que links diretos de pesquisa de satisfação funcionem perfeitamente em produção.
  Banco de Dados: PostgreSQL (Hospedado via Neon Cloud)

Deploy: Vercel (Frontend) e Render (Backend).

🌟 Diferenciais Técnicos
UX Persona-Based (Funil de Aprovação): Interface adaptativa que organiza o fluxo de trabalho do Administrador em estágios estratégicos: Aguardando Operacional ➔ Pendente de Aprovação ➔ Finalizado.

Sistema de Autenticação Robusto: Implementação de JWT com diferentes níveis de acesso (Admin vs Operacional).

Integridade de Dados e Saneamento: Manutenção ativa do banco de dados PostgreSQL para garantir métricas 100% íntegras, eliminando inconsistências e registros órfãos.

Regras de Negócio Integradas: Validação de status de empresa (bloqueio automático de feedbacks para empresas inativas).

Painel de Indicadores: Dashboard dinâmico com cálculo em tempo real de NPS Score e rankings de performance.

🛠️ Como Executar o Projeto

1. Clonar o repositório:

Bash
git clone https://github.com/maria-andrezza/nps-feedback-platform.git 2. Configurar o Backend:

Acesse a pasta: cd backend

Instale as dependências: npm install

Configure o .env com sua DATABASE_URL e JWT_SECRET

Inicie o servidor: npm run dev

3. Configurar o Frontend:

Acesse a pasta: cd frontend

Instale as dependências: npm install

Inicie a aplicação: npm run dev

Projeto desenvolvido por Maria Andrezza como parte do meu portfólio de transição para Desenvolvimento Full Stack.
