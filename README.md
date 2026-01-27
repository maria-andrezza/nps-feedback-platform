# 🚀 NPS Platform MVP - Full Stack

Este projeto é uma plataforma completa de gerenciamento de **Net Promoter Score (NPS)**, desenvolvida para unir a visão estratégica de Customer Success com o poder do desenvolvimento Full Stack.

## 💡 A Origem do Projeto

Baseado na minha experiência como **Analista de Sucesso do Cliente**, identifiquei que muitas empresas coletam dados, mas falham no "fechamento do ciclo" (_closed loop_). Este MVP resolve isso ao permitir que o time operacional registre resoluções e o time administrativo apresente aprovações ou reprovações das tratativas.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Material UI (MUI), Axios, React Router Dom.
- **Backend:** Node.js, Express, Prisma ORM, JWT, Bcrypt.
- **Banco de Dados:** PostgreSQL (Hospedado via Neon Cloud).

## 🌟 Diferenciais Técnicos

- Sistema de Autenticação e Autorização: Implementação de JWT com controle de acesso granular. A interface se adapta dinamicamente ao cargo do usuário (Admin vs Operacional).
- UX Persona-Based (Funil de Aprovação): Reformulação da visão do Administrador, substituindo filtros técnicos por um Funil de Processo (Pipeline). O Admin foca no fluxo de decisão: Aguardando Operacional ➔ Pendente de Aprovação ➔ Finalizado.
- Gestão de Estados Complexos: Uso de useState e useEffect para garantir que os filtros de funil não entrem em conflito com as regras de negócio do time operacional.
- Regras de Negócio Integradas: Validação automática de status de empresa e bloqueio de feedbacks para entidades inativas.
- Painel de Indicadores Real-time: Dashboard dinâmico com cálculo de NPS Score e segmentação automática de clientes.

## 🛠️ Manutenção e Integridade de Dados (Novo!)
- Recentemente, o projeto passou por uma fase de Sustentação e Refatoração, onde implementei:
- Saneamento de Banco de Dados: Identificação e correção de inconsistências no PostgreSQL (via Neon Cloud). Realizei o tratamento de registros "órfãos" (sem vínculos de empresa/usuário) para garantir que as métricas do Dashboard fossem 100% íntegras.
- Refatoração de Código (Clean Code): Remoção de variáveis e funções obsoletas após a transição para o novo sistema de funil, reduzindo a dívida técnica e melhorando a manutenibilidade.
- Otimização de Deploy: Configuração de rotas na Vercel via vercel.json para suporte a Client-side Routing, garantindo que links diretos de pesquisa de satisfação funcionem perfeitamente em produção.

## 🛠️ Como Executar o Projeto

**1. Clonar o repositório:**

```bash
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)

2. Configurar o Backend:

Acesse a pasta: cd backend.

Instale as dependências: npm install.

Configure o arquivo .env com sua DB_CONNECTION_STRING e JWT_SECRET.

Inicie o servidor: npm run dev.

3. Configurar o Frontend:

Acesse a pasta: cd frontend.

Instale as dependências: npm install.

Inicie a aplicação: npm run dev.

Projeto desenvolvido por Andreza Pereira como parte do meu portfólio de transição para Desenvolvimento Full Stack.
```
