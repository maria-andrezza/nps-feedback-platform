import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Avaliacoes from "./pages/Avaliacoes";
import Usuarios from "./pages/Usuarios";
import PesquisaFeedback from "./pages/PesquisaFeedback";
import Empresas from "./pages/Empresas";
import Navbar from "./components/Navbar";
import "./App.css";

// Componente para proteger rotas privadas
const PrivateRoute = ({
  children,
  roleRequired,
}: {
  children: React.ReactNode;
  roleRequired?: "admin" | "operacional";
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Layout com Navbar para rotas autenticadas
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <div className="container" style={{ padding: "20px" }}>
      {children}
    </div>
  </>
);

// Função App principal
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/feedback/:empresaId" element={<PesquisaFeedback />} />
          <Route path="/pesquisa/:id" element={<PesquisaFeedback />} />

          {/* Rotas Privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/avaliacoes"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Avaliacoes />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <PrivateRoute roleRequired="admin">
                <MainLayout>
                  <Usuarios />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/empresas"
            element={
              <PrivateRoute roleRequired="admin">
                <MainLayout>
                  <Empresas />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Redirecionamentos */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
