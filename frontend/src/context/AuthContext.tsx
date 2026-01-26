// AuthContext.tsx - VERSÃO COMPLETAMENTE CORRIGIDA
import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode"; // ← Import correto
import api from "../services/api";

interface User {
  id: number;
  nome: string; // ← Note: "nome" não "name"
  email: string;
  role: "operacional" | "admin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("nps_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      try {
        const decoded = jwtDecode<{
          // ← Mudei de jwt_decode para jwtDecode
          id: number;
          nome: string;
          email: string;
          role: string;
          exp?: number;
        }>(storedToken);

        // Verificar se o token expirou
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log("Token expirado");
          localStorage.removeItem("nps_token");
          localStorage.removeItem("user");
          setLoading(false);
          return;
        }

        setUser({
          id: decoded.id,
          nome: decoded.nome,
          email: decoded.email,
          role: decoded.role as "operacional" | "admin",
        });
        setToken(storedToken);
      } catch (err) {
        console.error("Erro ao decodificar token:", err);
        localStorage.removeItem("nps_token");
        localStorage.removeItem("user");
      }
    } else if (storedUser) {
      // Se tem usuário mas não tem token, limpar
      localStorage.removeItem("user");
    }

    setLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      console.log("🔍 Tentando login...");

      const response = await api.post(
        "/api/auth/login",
        {
          email,
          senha,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const { token: newToken, user: userData } = response.data;

      console.log("✅ Login bem-sucedido:");
      console.log("   Token recebido:", newToken?.substring(0, 20) + "...");
      console.log("   User recebido:", userData);

      if (!newToken) {
        throw new Error("Token não recebido do servidor");
      }

      // Salvar no localStorage
      localStorage.setItem("nps_token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Decodificar token para verificar
      try {
        const decoded = jwtDecode<{ role: string }>(newToken); // ← Mudei aqui também
        console.log("   Role no token:", decoded.role);
      } catch (e) {
        console.log("   Não foi possível decodificar o token");
      }

      // Atualizar estado
      setToken(newToken);
      setUser(userData);

      return response.data;
    } catch (err: any) {
      console.error("❌ Erro no login:", err);
      console.error("   Status:", err.response?.status);
      console.error("   Dados:", err.response?.data);

      let errorMessage = "Erro ao fazer login";

      if (err.response?.status === 401) {
        errorMessage = "Credenciais inválidas";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem("nps_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};
