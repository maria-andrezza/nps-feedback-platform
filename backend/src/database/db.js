// src/database/db.js - VERSÃO CORRIGIDA
const { Pool } = require("pg");
const path = require("path"); // ADICIONE

// Especifique o caminho correto
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", ".env"),
});

console.log("🔧 Configurando conexão com Neon PostgreSQL...");

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Teste automático da conexão
pool
  .query(
    "SELECT NOW() as tempo, current_database() as banco, version() as versao",
  )
  .then((result) => {
    const { tempo, banco, versao } = result.rows[0];
    console.log("✅ Banco conectado:");
    console.log(`   📍 Banco: ${banco}`);
    console.log(`   ⏰ Hora: ${tempo.toLocaleTimeString()}`);
    console.log(`   🐘 PostgreSQL: ${versao.split(",")[0]}`);
  })
  .catch((err) => {
    console.error("❌ Erro na conexão:", err.message);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
