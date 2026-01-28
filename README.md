🚀 NPS Feedback Platform (Full Stack MVP)
Esta plataforma foi desenvolvida para solucionar um problema real de negócio: a gestão e análise de feedbacks de clientes através da metodologia NPS (Net Promoter Score). Unindo minha experiência em Customer Success com o desenvolvimento de software, criei uma solução robusta para gerenciamento de usuários e coleta de insights.

📺 Demonstração em Vídeo
https://img.youtube.com/vi/JiyHZ6CiWt0/0.jpg

Clique na imagem acima para ver o vídeo completo com:

Login e autenticação JWT

Dashboard de métricas em tempo real

Funil de aprovação de feedbacks

CRUD completo de usuários

🔗 Link direto: https://www.youtube.com/watch?v=JiyHZ6CiWt0
📁 Vídeo local: sistemasnps.mp4 (incluído no repositório)

💡 A Origem do Projeto
Inspirada pela minha trajetória em empresas de tecnologia e SaaS, identifiquei que o maior desafio na gestão de experiência do cliente não é apenas a coleta de dados, mas a execução eficiente do "fechamento do ciclo" (closed loop).

Como Analista de Sucesso do Cliente, desenvolvi este MVP para traduzir essa dor de negócio em uma solução técnica robusta. O sistema garante que nenhum feedback seja esquecido através de um workflow de governança:

Time Operacional: Registra resoluções detalhadas para as tratativas das avaliações.

Time Administrativo: Possui uma visão de funil para aprovar ou reprovar as ações tomadas, fechando o ciclo de feedback com auditoria.

🛠️ Arquitetura & Tecnologias
Frontend
https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white

Backend
https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%2520web%2520tokens&logoColor=white

Banco de Dados & Hospedagem
https://img.shields.io/badge/Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white

📁 Estrutura do Projeto (Atual)
text
projeto-nps-mvp/
├── 📂 backend/ # API Node.js + Express
│ ├── 📂 src/
│ │ ├── 📂 database/
│ │ │ └── db.js # Conexão com banco de dados
│ │ └── 📂 middleware/
│ │ └── auth.js # Middleware de autenticação JWT
│ ├── server.js # Servidor principal
│ ├── gerarToken.js # Geração de tokens JWT
│ ├── .env # Variáveis de ambiente
│ ├── package.json # Dependências do backend
│ └── .gitignore
├── 📂 frontend/ # Aplicação React + TypeScript
│ ├── 📂 src/
│ │ ├── 📂 components/
│ │ │ └── Navbar.tsx # Barra de navegação
│ │ ├── 📂 context/
│ │ │ └── AuthContext.tsx # Contexto de autenticação
│ │ ├── 📂 pages/ # Páginas da aplicação
│ │ │ ├── Login.tsx # Página de login
│ │ │ ├── Dashboard.tsx # Dashboard principal
│ │ │ ├── Avaliacoes.tsx # Gestão de avaliações
│ │ │ ├── Empresas.tsx # Gestão de empresas
│ │ │ ├── Usuarios.tsx # Gestão de usuários
│ │ │ └── PesquisaFeedback.tsx # Pesquisa de feedback
│ │ ├── 📂 services/
│ │ │ └── api.ts # Configuração das chamadas API
│ │ ├── App.tsx # Componente principal
│ │ ├── main.tsx # Ponto de entrada
│ │ └── (arquivos de estilo)
│ ├── vercel.json # Configuração do deploy Vercel
│ ├── vite.config.ts # Configuração do Vite
│ ├── package.json # Dependências do frontend
│ └── .gitignore
├── 📄 LICENSE # Licença MIT
├── 📄 README.md # Esta documentação
└── 🎥 sistemasnps.mp4 # Vídeo demonstrativo
⚡ Funcionalidades Implementadas
🔐 Autenticação & Autorização

- Login com JWT tokens
- Contexto de autenticação no frontend (AuthContext.tsx)
- Middleware de proteção de rotas no backend (auth.js)

📊 Dashboard & Métricas

- Visualização em tempo real de métricas NPS
- Segmentação de clientes (Promotores, Neutros, Detratores)
- Dashboard interativo (Dashboard.tsx)

👥 Gestão de Entidades

- Usuários (Usuarios.tsx): CRUD completo de usuários do sistema
- Empresas (Empresas.tsx): Gestão das empresas clientes
- Avaliações (Avaliacoes.tsx): Processamento de feedbacks NPS

🔍 Pesquisa & Feedback

- Formulário de pesquisa de satisfação (PesquisaFeedback.tsx)
- Coleta e análise de feedbacks
- Workflow de aprovação/reprovação

🎨 Interface & UX

- Navbar responsiva (Navbar.tsx)
- Rotas protegidas baseadas em autenticação
- Design focado em experiência do usuário

🚀 Como Executar o Projeto Localmente
Pré-requisitos

- Node.js 16+
- npm ou yarn
- Git

1. Clonar o Repositório
   bash
   git clone https://github.com/maria-andrezza/projeto-nps-mvp.git
   cd projeto-nps-mvp
2. Configurar o Backend
   bash
   cd backend
   npm install
   Configure o arquivo .env:

env
PORT=5000
JWT_SECRET=sua_chave_secreta_jwt
DATABASE_URL=sua_url_do_banco

# Para SQLite: sqlite://./database.db

bash
npm start

# ou

node server.js 3. Configurar o Frontend
bash
cd ../frontend
npm install
Configure a API URL no services/api.ts se necessário:

typescript
const API_URL = "http://localhost:5000"; // URL do backend local
bash
npm run dev 4. Acessar a Aplicação
Frontend: http://localhost:5173 (padrão Vite)

Backend API: http://localhost:5000

Login inicial: Configure seu primeiro usuário via backend

🔧 Scripts Disponíveis
Backend
bash
cd backend
npm start # Inicia o servidor
npm run dev # Desenvolvimento com nodemon (se configurado)
Frontend
bash
cd frontend
npm run dev # Desenvolvimento (localhost:5173)
npm run build # Build para produção
npm run preview # Visualiza build localmente
🗺️ Fluxo de Trabalho (Workflow)
text
Cliente → Pesquisa NPS → Sistema classifica (0-10)
↓
[Backend] Processa e armazena
↓
[Frontend] Dashboard exibe métricas
↓
Time Operacional analisa e age
↓
Administrador aprova/reprova ações
↓
Ciclo fechado com auditoria completa
🔌 Configuração da API
O backend expõe os seguintes endpoints principais:

Método Endpoint Descrição
POST /api/auth/login Autenticação de usuários
GET /api/feedbacks Listar todos os feedbacks
POST /api/feedbacks Criar novo feedback
GET /api/users Listar usuários (admin)
POST /api/users Criar usuário (admin)
GET /api/metrics Obter métricas NPS
Exemplo de uso no frontend (services/api.ts):

typescript
// Estrutura básica para chamadas API
const response = await api.get('/feedbacks');
const data = response.data;
🧪 Como testar a autenticação
Execute o backend e frontend localmente

Acesse http://localhost:5173/login

- Crie seu próprio usuário através da interface
- Ou use o endpoint POST /api/users (apenas admin) para criar usuários

Nota: Por segurança, não fornecemos credenciais padrão.
Cada implementação deve ter seus próprios usuários.

🚢 Deploy & Produção
Frontend (Vercel)

- Conecte seu repositório na Vercel
- Configure vercel.json para roteamento
- Sete variáveis de ambiente na Vercel
- Deploy automático com Git push
  Backend (Render/Railway)
- Crie um novo Web Service no Render
- Conecte ao repositório GitHub

Configure:

- Build Command: npm install
- Start Command: node server.js
- Environment Variables: JWT_SECRET, DATABASE_URL

Banco de Dados

- SQLite para desenvolvimento/local
- PostgreSQL (Neon, Supabase, Railway) para produção

🧪 Testando a Aplicação

- Login: Acesse localhost:5173/login
- Dashboard: Veja métricas após login
- Navegação: Use a Navbar para acessar diferentes módulos
- CRUD: Teste criação/edição de usuários e empresas
- Feedback: Envie uma pesquisa NPS e acompanhe o fluxo

👤 Sobre a Desenvolvedora
Maria Andrezza
Analista de Customer Success em transição para Desenvolvimento Full Stack

https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white
https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white

"Transformando experiência em Customer Success em soluções técnicas robustas"

📄 Licença
Este projeto está licenciado sob a MIT License - veja o arquivo LICENSE para mais detalhes.

Copyright © 2024 Maria Andrezza. Todos os direitos reservados.
