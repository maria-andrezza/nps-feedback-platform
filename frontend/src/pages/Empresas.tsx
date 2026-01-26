// src/pages/Empresas.tsx - VERSÃO COM EXCLUSÃO/INATIVAÇÃO
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
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
} from "@mui/icons-material";
import api from "../services/api";

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  status: string;
  created_at?: string;
}

export default function Empresas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [actionType, setActionType] = useState<
    "delete" | "inactivate" | "activate"
  >("delete");
  const [formData, setFormData] = useState({ nome: "", cnpj: "" });
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
    } else {
      carregarEmpresas();
    }
  }, [user, navigate]);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/empresas");
      setEmpresas(res.data?.empresas || []);
    } catch (err: any) {
      setError("Erro ao carregar empresas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ nome: "", cnpj: "" });
  };

  const handleSalvarEmpresa = async () => {
    if (!formData.nome.trim()) {
      setError("Nome da empresa é obrigatório");
      return;
    }

    try {
      await api.post("/api/admin/empresas", formData);
      setSuccess("Empresa criada com sucesso!");
      carregarEmpresas();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar empresa");
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    empresa: Empresa,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedEmpresa(empresa);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedEmpresa(null);
  };

  const handleOpenConfirmDialog = (
    type: "delete" | "inactivate" | "activate",
  ) => {
    if (!selectedEmpresa) return;

    setActionType(type);
    setEmpresaToDelete(selectedEmpresa);
    setOpenConfirmDialog(true);
    handleMenuClose();
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setEmpresaToDelete(null);
  };

  const handleConfirmAction = async () => {
    if (!empresaToDelete) return;

    try {
      if (actionType === "delete") {
        await api.delete(`/api/admin/empresas/${empresaToDelete.id}`);
        setSuccess("Empresa excluída com sucesso!");
      } else if (actionType === "inactivate") {
        await api.put(`/api/admin/empresas/${empresaToDelete.id}/status`, {
          status: "inativo",
        });
        setSuccess("Empresa inativada com sucesso!");
      } else if (actionType === "activate") {
        await api.put(`/api/admin/empresas/${empresaToDelete.id}/status`, {
          status: "ativo",
        });
        setSuccess("Empresa ativada com sucesso!");
      }

      carregarEmpresas();
      handleCloseConfirmDialog();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Erro ao ${actionType === "delete" ? "excluir" : actionType === "inactivate" ? "inativar" : "ativar"} empresa`,
      );
    }
  };

  const copiarLink = (empresaId: number) => {
    const link = `${window.location.origin}/feedback/${empresaId}`;
    navigator.clipboard.writeText(link);
    setSuccess(`✅ Link copiado: ${link}`);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "ativo":
        return <Chip label="Ativo" color="success" size="small" />;
      case "inativo":
        return <Chip label="Inativo" color="error" size="small" />;
      default:
        return <Chip label="Ativo" color="success" size="small" />;
    }
  };

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
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Cabeçalho */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Empresas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nova Empresa
        </Button>
      </Box>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Lista de Empresas */}
      <Paper sx={{ p: 3 }}>
        {empresas.length === 0 ? (
          <Alert severity="info">Nenhuma empresa cadastrada</Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {empresas.map((empresa) => (
              <Paper
                key={empresa.id}
                sx={{
                  p: 3,
                  borderLeft: "4px solid",
                  borderLeftColor:
                    empresa.status === "inativo" ? "#f44336" : "#1976d2",
                  opacity: empresa.status === "inativo" ? 0.7 : 1,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6">{empresa.nome}</Typography>
                      {getStatusChip(empresa.status || "ativo")}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      CNPJ: {empresa.cnpj || "Não informado"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ID: {empresa.id} • Criada em:{" "}
                      {new Date(empresa.created_at || "").toLocaleDateString(
                        "pt-BR",
                      )}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Botão COPIAR LINK */}
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CopyIcon />}
                      onClick={() => copiarLink(empresa.id)}
                      sx={{ minWidth: 180 }}
                      disabled={empresa.status === "inativo"}
                    >
                      COPIAR LINK
                    </Button>

                    {/* Menu de ações */}
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, empresa)}
                      aria-label="opções"
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Instruções SIMPLIFICADAS */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2">Como usar:</Typography>
        <Typography variant="body2">
          1. Copie o link da empresa
          <br />
          2. Envie para os clientes via email, WhatsApp, etc.
          <br />
          3. Os clientes acessam e respondem a pesquisa
          <br />
          4. Empresas inativas não podem receber novas avaliações
        </Typography>
      </Alert>

      {/* Diálogo para criar empresa */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Empresa</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Nome da Empresa *"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
              placeholder="00.000.000/0000-00"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSalvarEmpresa} variant="contained">
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu de ações */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {selectedEmpresa?.status !== "inativo" ? (
          <MenuItem onClick={() => handleOpenConfirmDialog("inactivate")}>
            <BlockIcon fontSize="small" sx={{ mr: 1 }} />
            Inativar Empresa
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleOpenConfirmDialog("activate")}>
            <ActiveIcon fontSize="small" sx={{ mr: 1 }} />
            Ativar Empresa
          </MenuItem>
        )}
        <MenuItem onClick={() => handleOpenConfirmDialog("delete")}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir Empresa
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmação */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === "delete"
            ? "Excluir Empresa"
            : actionType === "inactivate"
              ? "Inativar Empresa"
              : "Ativar Empresa"}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            {actionType === "delete"
              ? `Tem certeza que deseja excluir permanentemente a empresa "${empresaToDelete?.nome}"? Esta ação não pode ser desfeita.`
              : actionType === "inactivate"
                ? `Deseja inativar a empresa "${empresaToDelete?.nome}"? Empresas inativas não poderão receber novas avaliações.`
                : `Deseja ativar a empresa "${empresaToDelete?.nome}"? Ela voltará a receber avaliações.`}
          </Typography>
          {actionType === "delete" && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Atenção:</strong> Esta ação excluirá permanentemente a
              empresa e todas as avaliações vinculadas a ela.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={actionType === "delete" ? "error" : "primary"}
          >
            {actionType === "delete"
              ? "Excluir"
              : actionType === "inactivate"
                ? "Inativar"
                : "Ativar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
        message={success}
      />
    </Container>
  );
}
