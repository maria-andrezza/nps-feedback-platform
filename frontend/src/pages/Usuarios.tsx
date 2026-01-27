// src/pages/Usuarios.tsx - VERSÃO ATUALIZADA E LIMPA
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
} from "@mui/material"; // 'Paper' removido por não ser utilizado
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  WorkspacePremium as OperacionalIcon,
} from "@mui/icons-material"; // Ícones não utilizados removidos para limpar o VS Code
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
      const res = await api.get("/api/admin/usuarios");
      if (res.data && Array.isArray(res.data)) {
        setUsuarios(res.data);
      }
    } catch (err) {
      console.log("⚠️ Backend offline, usando dados locais.");
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
    setError("");
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
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao salvar usuário");
    }
  };

  const handleDeletarUsuario = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await api.delete(`/api/admin/usuarios/${id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setSuccess("Usuário removido!");
    } catch (err) {
      setError("Erro ao excluir usuário");
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h5" color="primary" fontWeight="600">
          Gerenciar Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Novo Usuário
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}></Grid>

      <Grid container spacing={3}>
        {usuarios.map((usuario) => (
          <Grid item xs={12} sm={6} md={4} key={usuario.id}>
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor:
                        usuario.role === "admin"
                          ? "primary.main"
                          : "success.main",
                      mr: 2,
                    }}
                  >
                    {usuario.nome.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontSize: "1.1rem", fontWeight: 600 }}
                    >
                      {usuario.nome}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {usuario.email}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  icon={
                    usuario.role === "admin" ? (
                      <AdminIcon />
                    ) : (
                      <OperacionalIcon />
                    )
                  }
                  label={usuario.role.toUpperCase()}
                  color={usuario.role === "admin" ? "primary" : "success"}
                  size="small"
                  variant="outlined"
                />
              </CardContent>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  bgcolor: "#f9f9f9",
                  borderTop: "1px solid #eee",
                }}
              >
                <IconButton
                  onClick={() => handleOpenDialog(usuario)}
                  color="primary"
                >
                  <EditIcon />
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
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
          {selectedUsuario ? "Editar Usuário" : "Novo Usuário"}
        </DialogTitle>

        {/* CORREÇÃO DEFINITIVA DO LAYOUT: Padding superior forçado */}
        <DialogContent sx={{ pt: "24px !important", pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <TextField
              fullWidth
              label="Nome Completo"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              required
              variant="outlined"
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
                helperText="Mínimo 6 caracteres"
              />
            )}
            <TextField
              fullWidth
              select
              label="Perfil"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as any })
              }
              SelectProps={{ native: true }}
              variant="outlined"
            >
              <option value="operacional">Operacional</option>
              <option value="admin">Administrador</option>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button onClick={handleSalvarUsuario} variant="contained">
            {selectedUsuario ? "Atualizar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
        message={success}
      />
    </Container>
  );
}
