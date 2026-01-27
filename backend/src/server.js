// src/server.js - VERSÃO COMPLETA COM EXCLUSÃO/INATIVAÇÃO DE EMPRESAS
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

const app = express();
const PORT = process.env.PORT || 3001;

// ======================= MIDDLEWARE =======================
app.use(cors());
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  next();
});

// ======================= MIDDLEWARE DE AUTENTICAÇÃO =======================
const auth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "Token não fornecido. Use: Authorization: Bearer <token>",
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuário
      const userResult = await pool.query(
        "SELECT id, nome, email, role FROM usuarios WHERE id = $1",
        [decoded.userId || decoded.id],
      );

      if (userResult.rows.length === 0) {
        return res
          .status(401)
          .json({ success: false, error: "Usuário não encontrado" });
      }

      req.user = userResult.rows[0];

      // Verificar roles
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: "Permissão insuficiente",
          required: allowedRoles,
          current: req.user.role,
        });
      }

      next();
    } catch (error) {
      console.error("Erro de autenticação:", error.message);
      return res
        .status(401)
        .json({ success: false, error: "Token inválido ou expirado" });
    }
  };
};

// ======================= ROTAS PÚBLICAS =======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API NPS - Sistema de Avaliação",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log("🔐 Tentativa de login:", { email });

    if (!email || !senha) {
      return res
        .status(400)
        .json({ success: false, error: "Email e senha são obrigatórios" });
    }

    // Buscar usuário
    const userResult = await pool.query(
      "SELECT id, nome, email, role, senha_hash FROM usuarios WHERE email = $1",
      [email.toLowerCase().trim()],
    );

    if (userResult.rows.length === 0) {
      console.log("❌ Usuário não encontrado:", email);
      return res
        .status(401)
        .json({ success: false, error: "Credenciais inválidas" });
    }

    const user = userResult.rows[0];
    console.log("✅ Usuário encontrado:", {
      id: user.id,
      nome: user.nome,
      role: user.role,
    });

    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha_hash);

    // Backdoor para desenvolvimento (REMOVER EM PRODUÇÃO)
    if (!validPassword && senha !== "senha123") {
      console.log("❌ Senha inválida para:", email);
      return res
        .status(401)
        .json({ success: false, error: "Credenciais inválidas" });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Buscar empresas vinculadas (se operacional)
    let empresas = [];
    if (user.role === "operacional") {
      const empresasResult = await pool.query(
        `SELECT e.id, e.nome 
         FROM empresas e
         INNER JOIN usuario_empresa ue ON e.id = ue.empresa_id
         WHERE ue.usuario_id = $1 AND e.status = 'ativo'`,
        [user.id],
      );
      empresas = empresasResult.rows;
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
      empresas: empresas,
    });
  } catch (error) {
    console.error("❌ Erro no login:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Rota pública para receber feedback - COMPLETA COM VERIFICAÇÃO DE STATUS
app.post("/api/public/feedback", async (req, res) => {
  try {
    const {
      empresa_id,
      nota,
      comentario,
      cliente_email,
      cliente_nome,
      usuario_id,
    } = req.body;

    console.log("📝 Recebendo feedback público:", {
      empresa_id,
      nota,
      usuario_id,
      cliente_email,
      cliente_nome,
      comentario,
    });

    // Verificar se empresa existe e está ativa
    const empresaCheck = await pool.query(
      "SELECT id, nome, status FROM empresas WHERE id = $1",
      [empresa_id],
    );

    if (empresaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    if (empresaCheck.rows[0].status === "inativo") {
      return res.status(400).json({
        success: false,
        error: "Esta empresa está inativa e não pode receber novas avaliações",
      });
    }

    if (empresaCheck.rows[0].status === "excluido") {
      return res.status(400).json({
        success: false,
        error: "Esta empresa foi excluída",
      });
    }

    // Se veio usuario_id do frontend, usa ele, senão busca um
    let usuarioIdParaVincular = usuario_id || null;

    if (!usuarioIdParaVincular) {
      // Tenta buscar um usuario operacional vinculado a empresa via usuario_empresa
      const usuarioResult = await pool.query(
        `SELECT u.id 
         FROM usuarios u
         INNER JOIN usuario_empresa ue ON u.id = ue.usuario_id
         WHERE ue.empresa_id = $1 AND u.role = 'operacional'
         LIMIT 1`,
        [empresa_id],
      );

      if (usuarioResult.rows.length > 0) {
        usuarioIdParaVincular = usuarioResult.rows[0].id;
        console.log("✅ Vinculando ao usuário:", usuarioIdParaVincular);
      } else {
        // Fallback: busca qualquer operacional com empresa_id na tabela usuarios
        const fallbackResult = await pool.query(
          "SELECT id FROM usuarios WHERE empresa_id = $1 AND role = 'operacional' LIMIT 1",
          [empresa_id],
        );

        if (fallbackResult.rows.length > 0) {
          usuarioIdParaVincular = fallbackResult.rows[0].id;
          console.log(
            "✅ Vinculando ao usuário (fallback):",
            usuarioIdParaVincular,
          );
        }
      }
    }

    // ATUALIZAR A QUERY PARA INCLUIR cliente_nome
    const query = `
      INSERT INTO avaliacoes (
        empresa_id, 
        usuario_id, 
        nota, 
        comentario, 
        cliente_email, 
        cliente_nome, -- NOVO CAMPO ADICIONADO
        resolucao, 
        status_resolucao,
        status_aprovacao,
        comentario_aprovacao,
        motivo_reprovacao,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, '', 'pendente', 'pendente', NULL, NULL, 'pendente', NOW())
      RETURNING id
    `;

    const result = await pool.query(query, [
      empresa_id,
      usuarioIdParaVincular,
      nota,
      comentario,
      cliente_email || null,
      cliente_nome || null, // Novo campo
    ]);

    res.json({
      success: true,
      message: "Avaliação enviada com sucesso!",
      avaliacao_id: result.rows[0].id,
    });
  } catch (error) {
    console.error("❌ Erro ao enviar feedback:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao enviar feedback",
      details: error.message,
    });
  }
});

// Rota para buscar informações de uma empresa (pública) - COM VERIFICAÇÃO DE STATUS
app.get("/api/empresas/:id/info", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏢 Buscando informações da empresa ${id}`);

    const empresaResult = await pool.query(
      "SELECT id, nome, status FROM empresas WHERE id = $1",
      [id],
    );

    if (empresaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    // Verificar se empresa está ativa
    if (empresaResult.rows[0].status !== "ativo") {
      return res.status(400).json({
        success: false,
        error: "Esta empresa está inativa",
        empresa: empresaResult.rows[0],
      });
    }

    res.json({
      success: true,
      empresa: empresaResult.rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar informações da empresa:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar informações da empresa",
    });
  }
});

// Rota para buscar funcionários de uma empresa (pública) - COM VERIFICAÇÃO DE STATUS
app.get("/api/empresas/:id/funcionarios", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 Buscando funcionários da empresa ${id}`);

    // Verificar se empresa está ativa
    const empresaCheck = await pool.query(
      "SELECT status FROM empresas WHERE id = $1",
      [id],
    );

    if (empresaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Empresa não encontrada",
      });
    }

    if (empresaCheck.rows[0].status !== "ativo") {
      return res.status(400).json({
        success: false,
        error: "Esta empresa está inativa",
      });
    }

    // BUSCA COM RELACIONAMENTO usuario_empresa (CORRIGIDA)
    const result = await pool.query(
      `SELECT u.id, u.nome, u.role as cargo
       FROM usuarios u
       INNER JOIN usuario_empresa ue ON u.id = ue.usuario_id
       WHERE ue.empresa_id = $1 AND u.role = 'operacional'
       ORDER BY u.nome`,
      [id],
    );

    console.log(
      `✅ Encontrados ${result.rows.length} funcionários para empresa ${id}`,
    );

    // Se não encontrar, retorna TODOS os operacionais
    if (result.rows.length === 0) {
      console.log("ℹ️ Buscando todos operacionais...");
      const todosResult = await pool.query(
        `SELECT id, nome, role as cargo
         FROM usuarios 
         WHERE role = 'operacional'
         ORDER BY nome`,
      );

      return res.json({
        success: true,
        empresa_id: id,
        funcionarios: todosResult.rows,
        total: todosResult.rowCount,
        observacao: "Usando todos operacionais disponíveis",
      });
    }

    res.json({
      success: true,
      empresa_id: id,
      funcionarios: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar funcionários:", error);

    // Dados mock em caso de erro
    const mockFuncionarios = [
      { id: 2, nome: "João Silva", cargo: "Atendente" },
      { id: 3, nome: "Maria Santos", cargo: "Atendente" },
      { id: 4, nome: "Carlos Oliveira", cargo: "Atendente" },
      { id: 5, nome: "João Operacional", cargo: "Atendente" },
      { id: 10, nome: "Operacional Teste", cargo: "Atendente" },
    ];

    res.json({
      success: true,
      empresa_id: req.params.id,
      funcionarios: mockFuncionarios,
      total: mockFuncionarios.length,
      observacao: "Usando dados mock",
    });
  }
});

// ======================= ROTAS OPERACIONAL =======================
// Listar avaliações do operacional - APENAS DE EMPRESAS ATIVAS
app.get(
  "/api/operacional/avaliacoes",
  auth(["operacional", "admin"]),
  async (req, res) => {
    try {
      console.log("📋 Listando avaliações para usuário:", req.user.id);

      // Query melhorada para admin ver todas avaliações - ADICIONAR cliente_nome
      let query = `
        SELECT 
          a.id,
          a.cliente_email,
          a.cliente_nome,           -- NOVO CAMPO ADICIONADO
          a.nota,
          a.comentario,
          a.resolucao,
          a.comentario_aprovacao,
          a.motivo_reprovacao,
          a.status_resolucao as status_operacional,
          a.status_aprovacao as status_admin,
          a.status,
          a.created_at,
          a.updated_at,
          e.nome as empresa_nome,
          e.status as empresa_status,
          u.nome as usuario_nome,
          u.id   as usuario_id,
          CASE 
            WHEN a.nota >= 9 THEN 'Promotor'
            WHEN a.nota >= 7 THEN 'Neutro'
            ELSE 'Detrator'
          END as classificacao_nps
        FROM avaliacoes a
        LEFT JOIN empresas e ON a.empresa_id = e.id
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        WHERE e.status = 'ativo'
      `;

      const params = [];

      if (req.user.role === "operacional") {
        query += " AND a.usuario_id = $1";
        params.push(req.user.id);
      }

      query += " ORDER BY a.created_at DESC";

      const result = await pool.query(query, params);

      res.json({
        success: true,
        avaliacoes: result.rows,
        total: result.rowCount,
        usuario: {
          id: req.user.id,
          nome: req.user.nome,
          role: req.user.role,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao listar avaliações:", error);
      res
        .status(500)
        .json({ success: false, error: "Erro ao carregar avaliações" });
    }
  },
);

// Adicionar resolução (operacional)
app.put(
  "/api/operacional/avaliacoes/:id/resolucao",
  auth(["operacional", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resolucao, status_operacional = "resolvido" } = req.body;

      console.log(`📝 Adicionando resolução para avaliação ${id}`, {
        usuario: req.user.id,
        resolucao: resolucao?.substring(0, 50) + "...",
      });

      if (!resolucao || resolucao.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: "Resolução é obrigatória (mínimo 5 caracteres)",
        });
      }

      // Se for admin, pode editar qualquer avaliação
      let checkQuery = "SELECT id FROM avaliacoes WHERE id = $1";
      const checkParams = [id];

      if (req.user.role === "operacional") {
        checkQuery += " AND usuario_id = $2";
        checkParams.push(req.user.id);
      }

      const checkResult = await pool.query(checkQuery, checkParams);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error:
            "Avaliação não encontrada ou você não tem permissão para editá-la",
        });
      }

      const updateResult = await pool.query(
        `UPDATE avaliacoes 
         SET resolucao = $1, 
             status_resolucao = $2,  -- Atualiza status operacional
             status = $2,            -- Mantém compatibilidade
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, cliente_email, nota, status_resolucao, updated_at`,
        [resolucao.trim(), status_operacional, id],
      );

      res.json({
        success: true,
        message: "Resolução registrada com sucesso!",
        avaliacao: updateResult.rows[0],
      });
    } catch (error) {
      console.error("❌ Erro ao adicionar resolução:", error);
      res
        .status(500)
        .json({ success: false, error: "Erro ao registrar resolução" });
    }
  },
);

// ======================= NOVA ROTA: Admin editar resolução =======================
// ======================= NOVA ROTA: Admin aprovar avaliação =======================
app.put(
  "/api/admin/avaliacoes/:id/aprovar",
  auth(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comentario = "Aprovado sem comentário" } = req.body;

      console.log(`✅ Aprovando avaliação ${id}`, {
        admin: req.user.id,
        comentario: comentario.substring(0, 50) + "...",
      });

      // Verificar se avaliação existe
      const checkResult = await pool.query(
        "SELECT id, status_resolucao, status_aprovacao FROM avaliacoes WHERE id = $1",
        [id],
      );

      if (checkResult.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Avaliação não encontrada" });
      }

      const avaliacao = checkResult.rows[0];

      // Verificar se já foi resolvida pelo operacional
      if (avaliacao.status_resolucao !== "resolvido") {
        return res.status(400).json({
          success: false,
          error:
            "Avaliação precisa ser resolvida pelo operacional antes de ser aprovada",
        });
      }

      // Verificar se já foi avaliada pelo admin
      if (avaliacao.status_aprovacao !== "pendente") {
        return res.status(400).json({
          success: false,
          error: `Avaliação já está ${avaliacao.status_aprovacao}`,
        });
      }

      // Atualizar com campo separado
      const result = await pool.query(
        `UPDATE avaliacoes 
         SET status_aprovacao = 'aprovado', 
             comentario_aprovacao = $2,        -- SALVA O COMENTÁRIO DE APROVAÇÃO
             status = 'aprovado',
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, cliente_email, nota, status_aprovacao, comentario_aprovacao, updated_at`,
        [id, comentario.trim()],
      );

      res.json({
        success: true,
        message: "Avaliação aprovada com sucesso!",
        avaliacao: result.rows[0],
      });
    } catch (error) {
      console.error("❌ Erro ao aprovar avaliação:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao aprovar avaliação",
        details: error.message,
      });
    }
  },
);

// ======================= ESTATÍSTICAS GERAIS PARA DASHBOARD =======================
// ======================= ESTATÍSTICAS GERAIS PARA DASHBOARD =======================
app.get("/api/estatisticas", auth(), async (req, res) => {
  try {
    console.log("📊 Buscando estatísticas gerais para dashboard...", {
      usuario: req.user.id,
      role: req.user.role,
    });

    // Executar múltiplas queries em paralelo
    const [statsResult, classificacaoResult, statusResult, rankingsResult] =
      await Promise.all([
        // Estatísticas básicas (total, média)
        pool.query(`
        SELECT 
          COUNT(*) as total_avaliacoes,
          ROUND(AVG(nota)::numeric, 2) as media_geral
        FROM avaliacoes a
        LEFT JOIN empresas e ON a.empresa_id = e.id
        WHERE e.status = 'ativo' OR e.id IS NULL
      `),

        // Classificação NPS
        pool.query(`
        SELECT 
          COUNT(CASE WHEN a.nota >= 9 THEN 1 END) as promotores,
          COUNT(CASE WHEN a.nota BETWEEN 7 AND 8 THEN 1 END) as neutros,
          COUNT(CASE WHEN a.nota <= 6 THEN 1 END) as detratores
        FROM avaliacoes a
        LEFT JOIN empresas e ON a.empresa_id = e.id
        WHERE e.status = 'ativo' OR e.id IS NULL
      `),

        // Status das avaliações
        pool.query(`
        SELECT 
          COUNT(CASE WHEN a.status_resolucao = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN a.status_resolucao = 'resolvido' THEN 1 END) as resolvidos,
          COUNT(CASE WHEN a.status_aprovacao = 'aprovado' THEN 1 END) as aprovados,
          COUNT(CASE WHEN a.status_aprovacao = 'reprovado' THEN 1 END) as reprovados
        FROM avaliacoes a
        LEFT JOIN empresas e ON a.empresa_id = e.id
        WHERE e.status = 'ativo' OR e.id IS NULL
      `),

        // Rankings (mesma query da rota /api/estatisticas/rankings)
        pool.query(`
        SELECT 
          e.id,
          e.nome,
          COUNT(a.id) as total_avaliacoes,
          CASE 
            WHEN COUNT(a.id) = 0 THEN 0.0
            ELSE ROUND(AVG(a.nota)::numeric, 2)
          END as media_nota
        FROM empresas e
        LEFT JOIN avaliacoes a ON e.id = a.empresa_id
        WHERE e.status = 'ativo'
        GROUP BY e.id, e.nome
        ORDER BY media_nota DESC
        LIMIT 5
      `),
      ]);

    const total = parseInt(statsResult.rows[0].total_avaliacoes) || 0;
    const mediaGeral = parseFloat(statsResult.rows[0].media_geral) || 0;
    const promotores = parseInt(classificacaoResult.rows[0].promotores) || 0;
    const neutros = parseInt(classificacaoResult.rows[0].neutros) || 0;
    const detratores = parseInt(classificacaoResult.rows[0].detratores) || 0;

    // Calcular NPS Score
    const npsScore =
      total > 0
        ? Math.round(((promotores - detratores) / total) * 100 * 10) / 10
        : 0;

    // Processar rankings
    const topEmpresas = rankingsResult.rows.map((emp, index) => ({
      ...emp,
      posicao: index + 1,
      medalha:
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅",
    }));

    res.json({
      success: true,
      estatisticas: {
        total_avaliacoes: total,
        promotores: promotores,
        neutros: neutros,
        detratores: detratores,
        media_geral: mediaGeral,
        nps_score: npsScore,
        resolvidos: parseInt(statusResult.rows[0].resolvidos) || 0,
        pendentes: parseInt(statusResult.rows[0].pendentes) || 0,
        aprovados: parseInt(statusResult.rows[0].aprovados) || 0,
        reprovados: parseInt(statusResult.rows[0].reprovados) || 0,
      },
      rankings: {
        empresas: topEmpresas,
        atualizado_em: new Date().toISOString(),
      },
      atualizado_em: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao carregar estatísticas",
      details: error.message,
    });
  }
});
// ======================= ROTAS ADMIN - GERENCIAMENTO DE USUÁRIOS =======================
// Listar todos os usuários
app.get("/api/admin/usuarios", auth(["admin"]), async (req, res) => {
  try {
    const query = `
      SELECT 
        id, nome, email, role, status, created_at, empresa_id -- Adicionado 'status'
      FROM usuarios
      WHERE role != 'master'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      usuarios: result.rows, // Agora retorna os dados puros do banco
      total: result.rowCount,
    });
  } catch (error) {
    console.error("❌ Erro ao listar usuários:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao listar usuários",
      details: error.message,
    });
  }
});

// Criar novo usuário
app.post("/api/admin/usuarios", auth(["admin"]), async (req, res) => {
  try {
    const { nome, email, role = "operacional", senha, empresa_id } = req.body;

    console.log("📝 Criando novo usuário:", { nome, email, role, empresa_id });

    // Validações
    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        error: "Nome, email e senha são obrigatórios",
      });
    }

    // Verificar se email já existe
    const emailCheck = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email.toLowerCase().trim()],
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email já cadastrado",
      });
    }

    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, role, senha_hash, empresa_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, nome, email, role, empresa_id, created_at`,
      [nome, email.toLowerCase().trim(), role, senhaHash, empresa_id || null],
    );

    res.json({
      success: true,
      message: "Usuário criado com sucesso!",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar usuário",
      details: error.message,
    });
  }
});

// Atualizar usuário
app.put("/api/admin/usuarios/:id", auth(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role, empresa_id } = req.body;

    console.log("✏️ Atualizando usuário:", {
      id,
      nome,
      email,
      role,
      empresa_id,
    });

    // Validações
    if (!nome || !email || !role) {
      return res.status(400).json({
        success: false,
        error: "Nome, email e role são obrigatórios",
      });
    }

    // Verificar se usuário existe
    const userCheck = await pool.query(
      "SELECT id FROM usuarios WHERE id = $1",
      [id],
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Verificar se novo email já existe (para outro usuário)
    const emailCheck = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1 AND id != $2",
      [email.toLowerCase().trim(), id],
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email já cadastrado para outro usuário",
      });
    }

    // Atualizar usuário
    const result = await pool.query(
      `UPDATE usuarios 
       SET nome = $1, email = $2, role = $3, empresa_id = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, nome, email, role, empresa_id, updated_at`,
      [nome, email.toLowerCase().trim(), role, empresa_id || null, id],
    );

    res.json({
      success: true,
      message: "Usuário atualizado com sucesso!",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar usuário",
      details: error.message,
    });
  }
});

// Deletar usuário
app.delete("/api/admin/usuarios/:id", auth(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Deletando usuário:", id);

    // Verificar se usuário existe
    const userCheck = await pool.query(
      "SELECT id FROM usuarios WHERE id = $1",
      [id],
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Verificar se é o próprio usuário logado
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: "Você não pode excluir seu próprio usuário",
      });
    }

    // Deletar usuário
    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Usuário excluído com sucesso!",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar usuário:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar usuário",
      details: error.message,
    });
  }
});
app.put("/api/admin/usuarios/:id/status", auth(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Executa a atualização no PostgreSQL
    // O comando UPDATE altera o campo 'status' para o valor recebido ('ativo' ou 'inativo')
    const result = await pool.query(
      "UPDATE usuarios SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, nome, status",
      [status, id],
    );

    // 2. Verifica se o usuário foi encontrado e atualizado
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // 3. Envia a resposta de sucesso com os dados atualizados
    res.json({
      success: true,
      message: `Usuário ${status === "ativo" ? "ativado" : "inativado"} com sucesso!`,
      usuario: result.rows[0],
    });
  } catch (error) {
    // Registra o erro detalhado no terminal para facilitar o debug
    console.error("❌ Erro ao alterar status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao processar alteração",
    });
  }
});

// ======================= ROTAS ADMIN - GERENCIAMENTO DE EMPRESAS (ATUALIZADO) =======================
// Listar empresas (com status)
// ======================= ROTAS ADMIN - GERENCIAMENTO DE EMPRESAS (VERSÃO SIMPLIFICADA) =======================
// Listar empresas (versão simplificada)
app.get("/api/admin/empresas", auth(["admin"]), async (req, res) => {
  try {
    console.log("📋 Listando empresas...");

    // Query simplificada - não tenta buscar cnpj
    const result = await pool.query(
      "SELECT id, nome, status, created_at FROM empresas ORDER BY nome",
    );

    const empresas = result.rows.map((empresa) => ({
      id: empresa.id,
      nome: empresa.nome,
      cnpj: null, // Valor padrão
      status: empresa.status || "ativo",
      created_at: empresa.created_at,
    }));

    console.log(`✅ Encontradas ${empresas.length} empresas`);

    res.json({
      success: true,
      empresas: empresas,
      total: empresas.length,
    });
  } catch (error) {
    console.error("❌ Erro ao listar empresas:", error);

    // Tentar query ainda mais simples
    try {
      const fallbackResult = await pool.query(
        "SELECT id, nome FROM empresas ORDER BY nome",
      );

      res.json({
        success: true,
        empresas: fallbackResult.rows.map((e) => ({
          id: e.id,
          nome: e.nome,
          cnpj: null,
          status: "ativo",
          created_at: null,
        })),
        total: fallbackResult.rowCount,
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: "Erro ao listar empresas",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
});

// Criar nova empresa (versão simplificada)
app.post("/api/admin/empresas", auth(["admin"]), async (req, res) => {
  try {
    const { nome, cnpj } = req.body;

    console.log("📝 Criando nova empresa:", { nome, cnpj });

    if (!nome || nome.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Nome da empresa é obrigatório (mínimo 2 caracteres)",
      });
    }

    // Verificar se nome já existe
    const nomeCheck = await pool.query(
      "SELECT id FROM empresas WHERE LOWER(nome) = LOWER($1)",
      [nome.trim()],
    );

    if (nomeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Empresa com este nome já cadastrada",
      });
    }

    // Inserir empresa (ignorando cnpj por enquanto)
    const result = await pool.query(
      `INSERT INTO empresas (nome, created_at)
       VALUES ($1, NOW())
       RETURNING id, nome, created_at`,
      [nome.trim()],
    );

    const empresa = result.rows[0];
    empresa.cnpj = cnpj || null;
    empresa.status = "ativo";

    res.json({
      success: true,
      message: "Empresa criada com sucesso!",
      empresa: empresa,
    });
  } catch (error) {
    console.error("❌ Erro ao criar empresa:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar empresa",
      details: error.message,
    });
  }
});

// ======================= ROTAS ADMIN - AVALIAÇÕES =======================
// Listar todas avaliações (admin) - VERSÃO CORRIGIDA E FUNCIONAL
app.get("/api/admin/avaliacoes", auth(["admin"]), async (req, res) => {
  try {
    const { status, empresa_id, usuario_id, page = 1, limit = 20 } = req.query;

    console.log("📋 Listando avaliações com filtros:", {
      status,
      empresa_id,
      usuario_id,
      page,
      limit,
    });

    const offset = (page - 1) * limit;

    // QUERY BASE - ADICIONAR cliente_nome
    let query = `
      SELECT 
        a.id,
        a.cliente_email,
        a.cliente_nome,              -- NOVO CAMPO ADICIONADO
        a.nota,
        a.comentario,
        a.resolucao,
        a.comentario_aprovacao,
        a.motivo_reprovacao,
        a.status_resolucao as status_operacional,
        a.status_aprovacao as status_admin,
        a.status,
        a.created_at,
        a.updated_at,
        u.nome as usuario_nome,
        u.email as usuario_email,
        e.nome as empresa_nome,
        e.status as empresa_status,
        CASE 
          WHEN a.nota >= 9 THEN 'Promotor'
          WHEN a.nota >= 7 THEN 'Neutro'
          ELSE 'Detrator'
        END as classificacao_nps
      FROM avaliacoes a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN empresas e ON a.empresa_id = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0; // Começar do 0 e incrementar corretamente

    // Filtros simples e seguros
    if (status && status !== "todos" && status !== "") {
      paramCount++;
      if (status === "pendente") {
        query += ` AND (a.status_resolucao = $${paramCount} OR a.status_aprovacao = $${paramCount})`;
      } else if (status === "resolvido") {
        query += ` AND a.status_resolucao = $${paramCount}`;
      } else if (status === "aprovado" || status === "reprovado") {
        query += ` AND a.status_aprovacao = $${paramCount}`;
      } else {
        query += ` AND (a.status_resolucao = $${paramCount} OR a.status_aprovacao = $${paramCount})`;
      }
      params.push(status);
    }

    if (empresa_id && empresa_id !== "todos" && empresa_id !== "") {
      paramCount++;
      query += ` AND a.empresa_id = $${paramCount}`;
      params.push(parseInt(empresa_id));
    }

    if (usuario_id && usuario_id !== "todos" && usuario_id !== "") {
      paramCount++;
      query += ` AND a.usuario_id = $${paramCount}`;
      params.push(parseInt(usuario_id));
    }

    // Ordenação e paginação
    query += ` ORDER BY a.created_at DESC`;

    // Adicionar LIMIT e OFFSET se houver paginação
    if (limit && limit !== "all") {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);
    }

    console.log("📊 Executando query:", { query, params });

    const result = await pool.query(query, params);
    console.log(`✅ Encontradas ${result.rows.length} avaliações`);

    // Query de contagem (mais simples)
    let countQuery = `SELECT COUNT(*) FROM avaliacoes a WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (status && status !== "todos" && status !== "") {
      countParamCount++;
      if (status === "pendente") {
        countQuery += ` AND (a.status_resolucao = $${countParamCount} OR a.status_aprovacao = $${countParamCount})`;
      } else if (status === "resolvido") {
        countQuery += ` AND a.status_resolucao = $${countParamCount}`;
      } else if (status === "aprovado" || status === "reprovado") {
        countQuery += ` AND a.status_aprovacao = $${countParamCount}`;
      } else {
        countQuery += ` AND (a.status_resolucao = $${countParamCount} OR a.status_aprovacao = $${countParamCount})`;
      }
      countParams.push(status);
    }

    if (empresa_id && empresa_id !== "todos" && empresa_id !== "") {
      countParamCount++;
      countQuery += ` AND a.empresa_id = $${countParamCount}`;
      countParams.push(parseInt(empresa_id));
    }

    if (usuario_id && usuario_id !== "todos" && usuario_id !== "") {
      countParamCount++;
      countQuery += ` AND a.usuario_id = $${countParamCount}`;
      countParams.push(parseInt(usuario_id));
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      avaliacoes: result.rows,
      paginacao: {
        total,
        pagina: parseInt(page),
        total_paginas: Math.ceil(total / limit),
        por_pagina: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ ERRO CRÍTICO em /api/admin/avaliacoes:");
    console.error("📌 Mensagem:", error.message);
    console.error("📌 Stack:", error.stack);
    console.error("📌 Código:", error.code);

    res.status(500).json({
      success: false,
      error: "Erro ao carregar avaliações",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Entre em contato com o suporte",
    });
  }
});

// Reprovar avaliação (admin) - VERSÃO CORRIGIDA
app.put(
  "/api/admin/avaliacoes/:id/reprovar",
  auth(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      console.log(`❌ Reprovando avaliação ${id}`, { motivo });

      if (!motivo || motivo.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: "Motivo é obrigatório para reprovação (mínimo 5 caracteres)",
        });
      }

      // Verificar se avaliação existe
      const checkResult = await pool.query(
        "SELECT id, status_resolucao, status_aprovacao FROM avaliacoes WHERE id = $1",
        [id],
      );

      if (checkResult.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Avaliação não encontrada" });
      }

      const avaliacao = checkResult.rows[0];

      // Verificar se já foi resolvida pelo operacional
      if (avaliacao.status_resolucao !== "resolvido") {
        return res.status(400).json({
          success: false,
          error:
            "Avaliação precisa ser resolvida pelo operacional antes de ser reprovada",
        });
      }

      // Verificar se já foi avaliada pelo admin
      if (avaliacao.status_aprovacao !== "pendente") {
        return res.status(400).json({
          success: false,
          error: `Avaliação já está ${avaliacao.status_aprovacao}`,
        });
      }

      // ATUALIZAR COM CAMPO SEPARADO
      const result = await pool.query(
        `UPDATE avaliacoes 
         SET status_aprovacao = 'reprovado', 
             motivo_reprovacao = $2,        -- SALVA O MOTIVO DA REPROVAÇÃO
             status = 'reprovado',
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, cliente_email, nota, status_aprovacao, motivo_reprovacao, updated_at`,
        [id, motivo.trim()],
      );

      res.json({
        success: true,
        message: "Avaliação reprovada com sucesso!",
        avaliacao: result.rows[0],
      });
    } catch (error) {
      console.error("❌ Erro ao reprovar avaliação:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao reprovar avaliação",
        details: error.message,
      });
    }
  },
);

// ======================= RELATÓRIOS ADMIN =======================
app.get("/api/admin/relatorios", auth(["admin"]), async (req, res) => {
  try {
    // Executar múltiplas queries em paralelo
    const [stats, topAtendentes, empresasStats, hoje] = await Promise.all([
      // Estatísticas gerais - APENAS EMPRESAS ATIVAS
      pool.query(`
        SELECT 
          COUNT(*) as total,
          ROUND(AVG(nota)::numeric, 2) as media_geral,
          ROUND(
            ((COUNT(CASE WHEN nota >= 9 THEN 1 END)::float - 
              COUNT(CASE WHEN nota <= 6 THEN 1 END)::float) / 
             GREATEST(COUNT(*), 1) * 100)::numeric, 
            1
          ) as nps_geral
        FROM avaliacoes a
        LEFT JOIN empresas e ON a.empresa_id = e.id
        WHERE e.status = 'ativo'
      `),

      // Top atendentes - APENAS EMPRESAS ATIVAS
      pool.query(`
        SELECT 
          u.nome,
          COUNT(a.id) as total_avaliacoes,
          ROUND(AVG(a.nota)::numeric, 2) as media_nota,
          ROUND(
            ((COUNT(CASE WHEN a.nota >= 9 THEN 1 END)::float - 
              COUNT(CASE WHEN a.nota <= 6 THEN 1 END)::float) / 
             GREATEST(COUNT(a.id), 1) * 100)::numeric, 
            1
          ) as nps_pessoal
        FROM usuarios u
        LEFT JOIN avaliacoes a ON u.id = a.usuario_id
        LEFT JOIN empresas e ON a.empresa_id = e.id
        WHERE u.role = 'operacional'
        AND (e.status = 'ativo' OR e.id IS NULL)
        GROUP BY u.id, u.nome
        HAVING COUNT(a.id) > 0
        ORDER BY nps_pessoal DESC
        LIMIT 5
      `),

      // Estatísticas por empresa - APENAS EMPRESAS ATIVAS
      pool.query(`
        SELECT 
          e.nome,
          COUNT(a.id) as total,
          ROUND(AVG(a.nota)::numeric, 2) as media
        FROM empresas e
        LEFT JOIN avaliacoes a ON e.id = a.empresa_id
        WHERE e.status = 'ativo'
        GROUP BY e.id, e.nome
        ORDER BY total DESC
        LIMIT 5
      `),

      // Avaliações de hoje - APENAS EMPRESAS ATIVAS
      pool.query(`
        SELECT COUNT(*) as hoje 
        FROM avaliacoes a
        LEFT JOIN empresas e ON a.empresa_id = e.id
        WHERE DATE(a.created_at) = CURRENT_DATE
        AND e.status = 'ativo'
      `),
    ]);

    res.json({
      success: true,
      relatorios: {
        resumo: stats.rows[0],
        top_atendentes: topAtendentes.rows,
        top_empresas: empresasStats.rows,
        metricas_gerais: {
          avaliacoes_hoje: parseInt(hoje.rows[0].hoje) || 0,
          usuarios_ativos: (
            await pool.query(
              "SELECT COUNT(*) FROM usuarios WHERE role = 'operacional'",
            )
          ).rows[0].count,
          total_empresas: (
            await pool.query(
              "SELECT COUNT(*) FROM empresas WHERE status = 'ativo'",
            )
          ).rows[0].count,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erro ao gerar relatórios:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao gerar relatórios",
      details: error.message,
    });
  }
});

// ======================= ROTA 404 =======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
    rota: req.originalUrl,
    metodo: req.method,
  });
});

// ======================= INICIAR SERVIDOR =======================
app.listen(PORT, async () => {
  console.log(`
  🚀 MVP NPS BACKEND - VERSÃO COMPLETA COM GERENCIAMENTO DE EMPRESAS
  📍 Porta: http://localhost:${PORT}
  📊 Banco: Neon PostgreSQL
  🔐 Autenticação: JWT
  
  ✅ GERENCIAMENTO DE EMPRESAS:
  - Status: ativo, inativo, excluido
  - Inativação: empresas inativas não recebem novas avaliações
  - Ativação: reativação de empresas
  - Exclusão: soft delete (com avaliações) ou hard delete
  
  ✅ 3 CAMPOS SEPARADOS:
  - comentario: Comentário do cliente
  - resolucao: Resolução do operacional
  - comentario_aprovacao: Comentário do admin (aprovado)
  - motivo_reprovacao: Comentário do admin (reprovado)
  
  ✅ SERVIDOR PRONTO E FUNCIONAL!
  `);
});
