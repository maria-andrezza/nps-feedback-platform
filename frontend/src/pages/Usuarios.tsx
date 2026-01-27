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
  AdminPanelSettings as AdminIcon,
  WorkspacePremium as OperacionalIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import api from "../services/api";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: "operacional" | "admin";
  ativo: boolean; // Alterado de 'status' para 'ativo' conforme seu banco
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
      // Mapeia os dados do banco para garantir que o campo 'ativo' seja reconhecido
      const dadosFormatados = res.data.map((u: any) => ({
        ...u,
        ativo: u.ativo !== undefined ? u.ativo : true,
      }));
      setUsuarios(dadosFormatados);
    } catch (err) {
      setError("Erro ao carregar usuários do banco de dados.");
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
  };

  const handleSalvarUsuario = async () => {
    try {
      if (selectedUsuario) {
        await api.put(`/api/admin/usuarios/${selectedUsuario.id}`, formData);
        setSuccess("Usuário atualizado!");
      } else {
        await api.post("/api/admin/usuarios", formData);
        setSuccess("Usuário criado!");
      }
      carregarUsuarios();
      handleCloseDialog();
    } catch (err: any) {
      setError("Erro ao salvar usuário.");
    }
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      await api.put(`/api/admin/usuarios/${usuario.id}/status`, {
        ativo: !usuario.ativo,
      });
      setSuccess(`Usuário ${usuario.ativo ? "desativado" : "ativado"}!`);
      carregarUsuarios();
    } catch (err) {
      setError("Erro ao alterar status.");
    }
  };

  const handleDeletarUsuario = async (id: number) => {
    if (!confirm("Excluir usuário permanentemente?")) return;
    try {
      await api.delete(`/api/admin/usuarios/${id}`);
      setSuccess("Usuário removido!");
      carregarUsuarios();
    } catch (err) {
      setError("Erro ao excluir.");
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
        <Typography variant="h5" color="primary" fontWeight="600">
          Gerenciar Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Usuário
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {usuarios.map((u) => (
          <Grid item xs={12} sm={6} md={4} key={u.id}>
            <Card sx={{ borderRadius: 2, opacity: u.ativo ? 1 : 0.6 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor:
                        u.role === "admin" ? "primary.main" : "success.main",
                      mr: 2,
                    }}
                  >
                    {u.nome.charAt(0)}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {/* Aqui usamos o AdminIcon e o OperacionalIcon para limpar os avisos do VS Code */}
                      <Chip
                        icon={
                          u.role === "admin" ? (
                            <AdminIcon />
                          ) : (
                            <OperacionalIcon />
                          )
                        }
                        label={u.role.toUpperCase()}
                        color={u.role === "admin" ? "primary" : "success"}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={u.ativo ? "Ativo" : "Inativo"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" noWrap>
                      {u.nome}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {u.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip
                    label={u.role}
                    size="small"
                    color={u.role === "admin" ? "primary" : "success"}
                  />
                  <Chip
                    label={u.ativo ? "Ativo" : "Inativo"}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
              <CardActions
                sx={{ justifyContent: "flex-end", bgcolor: "#f9f9f9" }}
              >
                <IconButton onClick={() => handleOpenDialog(u)} color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleToggleStatus(u)}
                  color={u.ativo ? "warning" : "success"}
                >
                  {u.ativo ? <BlockIcon /> : <CheckCircleIcon />}
                </IconButton>
                <IconButton
                  onClick={() => handleDeletarUsuario(u.id)}
                  color="error"
                  disabled={u.id === user?.id}
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
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
          {selectedUsuario ? "Editar" : "Novo"} Usuário
        </DialogTitle>
        <DialogContent sx={{ pt: "24px !important", pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <TextField
              fullWidth
              label="Nome Completo"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              variant="outlined"
            />
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
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSalvarUsuario} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        message={success}
      />
    </Container>
  );
}
