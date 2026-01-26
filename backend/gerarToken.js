const jwt = require("jsonwebtoken");

const payload = {
  id: 1,
  email: "operacional@teste.com",
  role: "operacional",
  nome: "Operacional Teste",
};

const secret = "chave_muito_secreta_do_sistema_nps_2026_nao_compartilhe";

console.log("=== GERANDO TOKEN ===");
const token = jwt.sign(payload, secret, { expiresIn: "24h" });

console.log("\n=== TOKEN GERADO ===");
console.log(token);

console.log("\n=== PARA USAR NO THUNDER CLIENT ===");
console.log("Authorization: Bearer " + token);
