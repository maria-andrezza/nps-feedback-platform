// middleware/auth.js - VERSÃO UNIFICADA E MELHORADA
const jwt = require("jsonwebtoken");

const extractToken = (authHeader) => {
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "").trim();
};

const auth = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Verificar se o token foi fornecido
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Acesso negado. Token não fornecido.",
        hint: "Use: Authorization: Bearer <token>",
      });
    }

    // Extrair token
    const token = extractToken(authHeader);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Formato de token inválido.",
      });
    }

    // Verificar secret
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET não definido no ambiente");
      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor.",
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Validar estrutura básica do payload (compatibilidade)
      const userId = decoded.userId || decoded.id;
      const userRole = decoded.role || decoded.role;

      if (!userId || !userRole) {
        return res.status(400).json({
          success: false,
          error: "Token com estrutura inválida.",
        });
      }

      // Adicionar usuário à requisição (padrão consistente)
      req.user = {
        id: userId,
        role: userRole.toLowerCase(),
        email: decoded.email || decoded.email,
        nome: decoded.nome || decoded.name || decoded.nome,
        ...decoded,
      };

      // Verificar permissões de role
      if (roles.length > 0) {
        const userRoleLower = req.user.role;
        const allowedRoles = roles.map((r) => r.toLowerCase());

        if (!allowedRoles.includes(userRoleLower)) {
          return res.status(403).json({
            success: false,
            error: "Permissão insuficiente para este recurso.",
            requiredRoles: roles,
            userRole: userRoleLower,
          });
        }
      }

      next();
    } catch (error) {
      // Tratamento específico de erros JWT
      let statusCode = 401;
      let errorMessage = "Token inválido.";

      if (error.name === "TokenExpiredError") {
        statusCode = 401;
        errorMessage = "Token expirado. Faça login novamente.";
      } else if (error.name === "JsonWebTokenError") {
        statusCode = 400;
        errorMessage = "Token malformado.";
      }

      console.error(`❌ Erro de autenticação (${error.name}):`, error.message);
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
      });
    }
  };
};

// Funções auxiliares para uso comum
auth.required = () => auth();
auth.admin = () => auth(["admin"]);
auth.moderator = () => auth(["admin", "moderator"]);
auth.user = () => auth(["user"]);
auth.operacional = () => auth(["operacional", "admin"]);
auth.all = () => auth(["user", "operacional", "moderator", "admin"]);

// Objeto middleware pré-definido para facilitar
auth.middleware = {
  required: auth(),
  admin: auth(["admin"]),
  moderator: auth(["admin", "moderator"]),
  user: auth(["user", "admin", "moderator"]),
  operacional: auth(["operacional", "admin"]),
  all: auth(["user", "operacional", "moderator", "admin"]),
};

module.exports = auth;
