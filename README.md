# 🚀 NPS Platform MVP - Full Stack

Este projeto é uma plataforma completa de gerenciamento de **Net Promoter Score (NPS)**, desenvolvida para unir a visão estratégica de Customer Success com o poder do desenvolvimento Full Stack.

## 💡 A Origem do Projeto

Baseado na minha experiência como **Analista de Sucesso do Cliente**, identifiquei que muitas empresas coletam dados, mas falham no "fechamento do ciclo" (_closed loop_). Este MVP resolve isso ao permitir que o time operacional registre resoluções e o time administrativo apresente aprovações ou reprovações das tratativas.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Material UI (MUI), Axios, React Router Dom.
- **Backend:** Node.js, Express, Prisma ORM, JWT, Bcrypt.
- **Banco de Dados:** PostgreSQL (Hospedado via Neon Cloud).

## 🌟 Diferenciais Técnicos

- **Sistema de Autenticação Robusto:** Implementação de JWT com diferentes níveis de acesso (Admin vs Operacional).
- **Gestão de Estados:** Uso de Context API para persistência de dados de autenticação e controle de acesso em rotas privadas.
- **Regras de Negócio Integradas:** Validação de status de empresa (empresas inativas ou excluídas são bloqueadas automaticamente de receber novos feedbacks).
- **Painel de Indicadores:** Dashboard dinâmico com cálculo em tempo real de NPS Score, segmentação de clientes (Promotores, Neutros e Detratores) e rankings de empresas.

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
