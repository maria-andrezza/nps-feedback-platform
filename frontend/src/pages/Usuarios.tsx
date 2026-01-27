import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
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

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
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

      const dadosRecebidos = res.data?.usuarios || res.data;

      if (Array.isArray(dadosRecebidos)) {
        setUsuarios(dadosRecebidos);
      } else {
        throw new Error("Resposta do servidor em formato inválido");
      }
    } catch (err: any) {
      console.error("⚠️ Erro ao carregar:", err);
      setBackendError(true);
      setError("Não foi possível carregar os dados do servidor.");
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
      setFormData({ nome: "", email: "", role: "operacional", senha: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUsuario(null);
    setError("");
  };

  const handleSalvarUsuario = async () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      setError("Nome e email são obrigatórios");
      return;
    }

    try {
      if (backendError) {
        if (selectedUsuario) {
          setUsuarios((prev) =>
            prev.map((u) =>
              u.id === selectedUsuario.id ? { ...u, ...formData } : u,
            ),
          );
        } else {
          const novo: Usuario = {
            id: Date.now(),
            nome: formData.nome,
            email: formData.email,
            role: formData.role,
            status: "ativo",
          };
          setUsuarios((prev) => [...prev, novo]);
        }
        setSuccess("Alteração local realizada (Modo Offline)");
      } else {
        if (selectedUsuario) {
          const { senha, ...dadosParaEnviar } = formData;
          await api.put(
            `/api/admin/usuarios/${selectedUsuario.id}`,
            dadosParaEnviar,
          );
        } else {
          await api.post("/api/admin/usuarios", formData);
        }
        await carregarUsuarios();
        setSuccess("Sucesso!");
      }
      handleCloseDialog();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao salvar");
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
      setSuccess(`Status alterado para ${novoStatus}`);
    } catch (err) {
      setError("Erro ao alterar status");
    }
  };

  const handleDeletarUsuario = async (id: number) => {
    if (!confirm("Excluir este usuário?")) return;
    try {
      if (!backendError) await api.delete(`/api/admin/usuarios/${id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setSuccess("Removido!");
    } catch (err) {
      setError("Erro ao excluir");
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Box>
          <Typography variant="h5" color="primary" fontWeight="600">
            Gerenciar Usuários
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {usuarios.length}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Usuário
        </Button>
      </Box>

      {backendError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Modo Offline: Servidor indisponível.
        </Alert>
      )}
      {error && !backendError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {usuarios.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">Nenhum usuário cadastrado</Alert>
          </Grid>
        ) : (
          usuarios.map((usuario) => (
            <Grid item xs={12} sm={6} md={4} key={usuario.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  borderLeft: `4px solid ${usuario.role === "admin" ? "#1976d2" : "#2e7d32"}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
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
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {usuario.nome}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        noWrap
                      >
                        {usuario.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip
                      label={usuario.role}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={usuario.status}
                      size="small"
                      color={usuario.status === "ativo" ? "success" : "error"}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end" }}>
                  <IconButton
                    onClick={() => handleOpenDialog(usuario)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleToggleStatus(usuario)}
                    color={usuario.status === "ativo" ? "warning" : "success"}
                  >
                    {usuario.status === "ativo" ? (
                      <BlockIcon />
                    ) : (
                      <CheckCircleIcon />
                    )}
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeletarUsuario(usuario.id)}
                    color="error"
                    disabled={usuario.id === user?.id}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        message={success}
      />

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {selectedUsuario ? "Editar Usuário" : "Novo Usuário"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label="Nome"
            fullWidth
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          {!selectedUsuario && (
            <TextField
              label="Senha"
              type="password"
              fullWidth
              value={formData.senha}
              onChange={(e) =>
                setFormData({ ...formData, senha: e.target.value })
              }
            />
          )}
          <TextField
            select
            label="Perfil"
            SelectProps={{ native: true }}
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as any })
            }
          >
            <option value="operacional">Operacional</option>
            <option value="admin">Administrador</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSalvarUsuario} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
