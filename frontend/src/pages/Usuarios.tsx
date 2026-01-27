// src/pages/Usuarios.tsx - VERSÃO FINAL SEM NAVBAR DUPLICADA
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Snackbar,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon,
  WorkspacePremium as OperacionalIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import api from "../services/api";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: "operacional" | "admin";
  status: "ativo" | "inativo";
}

export default function Usuarios() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: 1,
      nome: "Administrador Master",
      email: "admin@nps.com",
      role: "admin",
      status: "ativo",
    },
    {
      id: 2,
      nome: "João Silva",
      email: "joao.silva@empresa.com",
      role: "operacional",
      status: "ativo",
    },
    {
      id: 3,
      nome: "Maria Santos",
      email: "maria.santos@empresa.com",
      role: "operacional",
      status: "ativo",
    },
    {
      id: 4,
      nome: "Carlos Oliveira",
      email: "carlos.oliveira@empresa.com",
      role: "operacional",
      status: "inativo",
    },
    {
      id: 5,
      nome: "João Operacional",
      email: "operacional@empresa.com",
      role: "operacional",
      status: "ativo",
    },
    {
      id: 10,
      nome: "Operacional Teste",
      email: "op123@empresa.com",
      role: "operacional",
      status: "ativo",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    role: "operacional" as "operacional" | "admin",
    senha: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
    } else {
      carregarUsuarios();
    }
  }, [user, navigate]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setBackendError(false);

      const res = await api.get("/api/admin/usuarios");

      if (res.data && Array.isArray(res.data)) {
        setUsuarios(res.data);
      } else if (res.data && Array.isArray(res.data.usuarios)) {
        setUsuarios(res.data.usuarios);
      }
    } catch (err) {
      console.log("⚠️ Usando dados locais:", err);
      setBackendError(true);
      // Dados já estão no estado inicial
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (usuario?: Usuario) => {
    if (usuario) {
      setSelectedUsuario(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        senha: "",
      });
    } else {
      setSelectedUsuario(null);
      setFormData({
        nome: "",
        email: "",
        role: "operacional",
        senha: "",
      });
    }
    setOpenDialog(true);
    setError("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUsuario(null);
    setFormData({
      nome: "",
      email: "",
      role: "operacional",
      senha: "",
    });
    setError("");
  };

  const handleSalvarUsuario = async () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      setError("Nome e email são obrigatórios");
      return;
    }

    if (!selectedUsuario && (!formData.senha || formData.senha.length < 6)) {
      setError("Senha é obrigatória (mínimo 6 caracteres)");
      return;
    }

    try {
      if (backendError) {
        // Modo offline
        if (selectedUsuario) {
          setUsuarios((prev) =>
            prev.map((u) =>
              u.id === selectedUsuario.id
                ? {
                    ...u,
                    nome: formData.nome,
                    email: formData.email,
                    role: formData.role,
                  }
                : u,
            ),
          );
          setSuccess("Usuário atualizado localmente");
        } else {
          const novoUsuario: Usuario = {
            id: Math.max(...usuarios.map((u) => u.id)) + 1,
            nome: formData.nome,
            email: formData.email,
            role: formData.role,
            status: "ativo",
          };
          setUsuarios((prev) => [...prev, novoUsuario]);
          setSuccess("Usuário criado localmente");
        }
      } else {
        // Modo online
        if (selectedUsuario) {
          const { senha, ...dadosParaEnviar } = formData;
          await api.put(
            `/api/admin/usuarios/${selectedUsuario.id}`,
            dadosParaEnviar,
          );
          setSuccess("Usuário atualizado com sucesso!");
        } else {
          await api.post("/api/admin/usuarios", formData);
          setSuccess("Usuário criado com sucesso!");
        }
        carregarUsuarios();
      }

      handleCloseDialog();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao salvar usuário");
    }
  };

  const handleDeletarUsuario = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    if (id === user?.id) {
      alert("Você não pode excluir seu próprio usuário");
      return;
    }

    try {
      if (!backendError) {
        await api.delete(`/api/admin/usuarios/${id}`);
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setSuccess(
        "Usuário removido" + (backendError ? " (modo offline)" : "") + "!",
      );

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Erro ao excluir usuário");
    }
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    const novoStatus = usuario.status === "ativo" ? "inativo" : "ativo";

    try {
      if (!backendError) {
        await api.put(`/api/admin/usuarios/${usuario.id}/status`, {
          status: novoStatus,
        });
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, status: novoStatus } : u,
        ),
      );

      setSuccess(
        `Usuário ${novoStatus === "ativo" ? "ativado" : "desativado"}${backendError ? " (modo offline)" : ""}!`,
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Erro ao alterar status");
    }
  };

  // Estatísticas
  const totalUsuarios = usuarios.length;
  const usuariosAtivos = usuarios.filter((u) => u.status === "ativo").length;
  const admins = usuarios.filter((u) => u.role === "admin").length;

  if (loading) {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    // REMOVIDO: <Navbar /> daqui - já está no layout principal
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* CABEÇALHO SIMPLIFICADO - SEM DUPLICIDADE */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            gutterBottom
            color="primary"
            fontWeight="600"
          >
            Gerenciar Usuários
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {usuarios.length} usuários cadastrados
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* AVISO DE MODO OFFLINE */}
      {backendError && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<ErrorIcon />}>
          ⚠️ Backend offline. Trabalhando com dados locais.
        </Alert>
      )}

      {/* MENSAGENS DE FEEDBACK */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess("")}
          message={success}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        />
      )}

      {/* CARDS DE ESTATÍSTICAS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="h3" color="primary" fontWeight="bold">
              {totalUsuarios}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Total de Usuários
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {usuariosAtivos}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Usuários Ativos
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="h3" color="info.main" fontWeight="bold">
              {admins}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Administradores
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* LISTA DE USUÁRIOS EM CARDS */}
      <Grid container spacing={3}>
        {usuarios.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Nenhum usuário cadastrado
            </Alert>
          </Grid>
        ) : (
          usuarios.map((usuario) => (
            <Grid item xs={12} sm={6} md={4} key={usuario.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  borderLeft: `4px solid ${
                    usuario.role === "admin" ? "#1976d2" : "#2e7d32"
                  }`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* AVATAR E NOME */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        mr: 2,
                        bgcolor:
                          usuario.role === "admin"
                            ? "primary.main"
                            : "success.main",
                      }}
                    >
                      {usuario.nome.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" noWrap>
                        {usuario.nome}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {usuario.email}
                      </Typography>
                    </Box>
                  </Box>

                  {/* CHIPS DE STATUS */}
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <Chip
                      icon={
                        usuario.role === "admin" ? (
                          <AdminIcon />
                        ) : (
                          <OperacionalIcon />
                        )
                      }
                      label={usuario.role === "admin" ? "Admin" : "Operacional"}
                      color={usuario.role === "admin" ? "primary" : "success"}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={
                        usuario.status === "ativo" ? (
                          <CheckCircleIcon />
                        ) : (
                          <BlockIcon />
                        )
                      }
                      label={usuario.status === "ativo" ? "Ativo" : "Inativo"}
                      color={usuario.status === "ativo" ? "success" : "error"}
                      size="small"
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(usuario)}
                    color="primary"
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(usuario)}
                    color={usuario.status === "ativo" ? "warning" : "success"}
                    title={usuario.status === "ativo" ? "Desativar" : "Ativar"}
                  >
                    {usuario.status === "ativo" ? (
                      <BlockIcon />
                    ) : (
                      <CheckCircleIcon />
                    )}
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleDeletarUsuario(usuario.id)}
                    color="error"
                    disabled={usuario.id === user?.id}
                    title="Excluir"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* DIÁLOGO PARA CRIAR/EDITAR USUÁRIO */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
          {selectedUsuario ? "Editar Usuário" : "Novo Usuário"}
          {backendError && " (Modo Offline)"}
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="Nome Completo"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              required
              variant="outlined"
              size="small"
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              variant="outlined"
              size="small"
            />

            {!selectedUsuario && (
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={formData.senha}
                onChange={(e) =>
                  setFormData({ ...formData, senha: e.target.value })
                }
                required
                variant="outlined"
                size="small"
                helperText="Mínimo 6 caracteres"
              />
            )}

            <TextField
              fullWidth
              select
              label="Perfil"
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "operacional" | "admin",
                })
              }
              SelectProps={{ native: true }}
              variant="outlined"
              size="small"
            >
              <option value="operacional">Operacional</option>
              <option value="admin">Administrador</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleSalvarUsuario} variant="contained">
            {selectedUsuario ? "Atualizar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
