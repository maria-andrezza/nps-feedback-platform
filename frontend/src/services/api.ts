// src/services/api.ts - VERSÃO SIMPLIFICADA E FUNCIONAL
import axios, { AxiosInstance } from "axios";

// Criar instância do axios
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:3001",
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
      // Garantir que headers é um objeto
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de resposta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem("token");
      localStorage.removeItem("nps_token");
      localStorage.removeItem("user");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
