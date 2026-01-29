// src/services/api.ts - VOLTAR PARA PRODUÇÃO
import axios, { AxiosInstance } from "axios";

// Criar instância do axios - PRODUÇÃO
const api: AxiosInstance = axios.create({
  baseURL: "https://nps-feedback-platform.onrender.com", // ← PRODUÇÃO
  // baseURL: "http://localhost:3001", // ← COMENTAR/REMOVER
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    // Não adicionar token para rotas públicas
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/public/") ||
      (config.url?.includes("/empresas/") && config.method === "GET")
    ) {
      return config;
    }

    // Buscar token
    const token =
      localStorage.getItem("token") || localStorage.getItem("nps_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de resposta FIXADO - NÃO REDIRECIONA PARA LOGIN
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // APENAS LOG NO CONSOLE, NÃO REDIRECIONA
    console.error("❌ Erro na API:", {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.error || error.message,
    });

    // IMPORTANTE: NÃO FAZ window.location.href = "/login"
    // Isso permite que páginas públicas funcionem mesmo com erro 401

    return Promise.reject(error);
  },
);

export default api;
