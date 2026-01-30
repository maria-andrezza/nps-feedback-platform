import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  Container,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Avatar,
  Grid,
  Card,
  CardContent,
  alpha,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BuildIcon from "@mui/icons-material/Build";
import DownloadIcon from "@mui/icons-material/Download";
import SortIcon from "@mui/icons-material/Sort";
import ClearIcon from "@mui/icons-material/Clear";
import GavelIcon from "@mui/icons-material/Gavel";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import BusinessIcon from "@mui/icons-material/Business";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import VerifiedIcon from "@mui/icons-material/Verified";
import SearchIcon from "@mui/icons-material/Search";
import MessageIcon from "@mui/icons-material/Message";
import RateReviewIcon from "@mui/icons-material/RateReview";
import DescriptionIcon from "@mui/icons-material/Description";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function Avaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openResolucao, setOpenResolucao] = useState(false);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<any>(null);
  const [resolucaoText, setResolucaoText] = useState("");
  const { user } = useAuth();

  // Filtros e ordenação
  const [filtroProcessoAdmin, setFiltroProcessoAdmin] =
    useState<string>("todos");
  const [filtroStatusOperacional, setFiltroStatusOperacional] =
    useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<
    "crescente" | "decrescente" | "nenhuma"
  >("nenhuma");

  // Modal de aprovação
  const [openAprovarModal, setOpenAprovarModal] = useState(false);
  const [avaliacaoParaAprovar, setAvaliacaoParaAprovar] = useState<any>(null);
  const [comentarioAprovacao, setComentarioAprovacao] = useState("");

  // Modal de reprovação
  const [openReprovarModal, setOpenReprovarModal] = useState(false);
  const [avaliacaoParaReprovar, setAvaliacaoParaReprovar] = useState<any>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState("");

  // Busca
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        user?.role === "admin"
          ? "/api/admin/avaliacoes"
          : "/api/operacional/avaliacoes";

      const response = await api.get(`${endpoint}?limit=100`);

      if (response.data.success) {
        setAvaliacoes(response.data.avaliacoes);
        console.log("✅ Avaliações carregadas:", response.data.avaliacoes);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao carregar avaliações");
      console.error("Erro ao carregar avaliações:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNomeOperacional = (av: any) => {
    if (av.usuario_nome) return av.usuario_nome;
    if (user?.role === "operacional" && av.usuario_id === user?.id) {
      return "Você";
    }
    return av.usuario_id ? `Operacional #${av.usuario_id}` : "Não atribuído";
  };

  const getNomeEmpresa = (av: any) => {
    if (av.empresa_nome) return av.empresa_nome;
    return av.empresa_id ? `Empresa #${av.empresa_id}` : "—";
  };

  const getIniciais = (nome: string) => {
    if (!nome || nome === "Não atribuído" || nome === "Você" || nome === "—")
      return "?";
    const partes = nome.split(" ").filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (
      partes[0].charAt(0) + partes[partes.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getAvatarColor = (id?: number) => {
    if (!id) return "#9e9e9e";
    const colors = ["#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2"];
    return colors[id % colors.length];
  };

  const abrirDialogResolucao = (avaliacao: any) => {
    setAvaliacaoSelecionada(avaliacao);
    setResolucaoText(avaliacao.resolucao || "");
    setOpenResolucao(true);
  };

  const fecharDialogResolucao = () => {
    setOpenResolucao(false);
    setAvaliacaoSelecionada(null);
    setResolucaoText("");
  };

  const salvarResolucao = async () => {
    if (!resolucaoText.trim() || resolucaoText.length < 5) {
      alert("Resolução é obrigatória (mínimo 5 caracteres)");
      return;
    }

    try {
      const payload = {
        resolucao: resolucaoText.trim(),
        status_resolucao: "resolvido",
      };

      if (user?.role === "admin") {
        try {
          await api.put(
            `/api/admin/avaliacoes/${avaliacaoSelecionada.id}/editar-resolucao`,
            payload,
          );
        } catch {
          await api.put(
            `/api/operacional/avaliacoes/${avaliacaoSelecionada.id}/resolucao`,
            payload,
          );
        }
      } else {
        await api.put(
          `/api/operacional/avaliacoes/${avaliacaoSelecionada.id}/resolucao`,
          payload,
        );
      }

      alert("Resolução salva com sucesso!");
      fecharDialogResolucao();
      carregarAvaliacoes();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          "Erro ao salvar resolução. Verifique se a avaliação pertence a você.",
      );
    }
  };

  const abrirModalAprovacao = (id: number) => {
    const avaliacao = avaliacoes.find((av) => av.id === id);
    if (avaliacao) {
      setAvaliacaoParaAprovar(avaliacao);
      setComentarioAprovacao("");
      setOpenAprovarModal(true);
    }
  };

  const confirmarAprovacao = async () => {
    try {
      await api.put(
        `/api/admin/avaliacoes/${avaliacaoParaAprovar.id}/aprovar`,
        {
          comentario: comentarioAprovacao.trim() || "Aprovado sem comentário",
        },
      );

      alert("Avaliação aprovada com sucesso!");
      setOpenAprovarModal(false);
      setAvaliacaoParaAprovar(null);
      setComentarioAprovacao("");
      carregarAvaliacoes();
    } catch (err: any) {
      alert(
        err.response?.data?.error?.includes("precisa ser resolvida")
          ? "A avaliação precisa ser resolvida primeiro."
          : "Erro ao aprovar avaliação.",
      );
    }
  };

  const abrirModalReprovacao = (id: number) => {
    const avaliacao = avaliacoes.find((av) => av.id === id);
    if (avaliacao) {
      setAvaliacaoParaReprovar(avaliacao);
      setMotivoReprovacao("");
      setOpenReprovarModal(true);
    }
  };

  const confirmarReprovacao = async () => {
    if (!motivoReprovacao.trim() || motivoReprovacao.trim().length < 5) {
      alert("Motivo é obrigatório (mínimo 5 caracteres)");
      return;
    }

    try {
      await api.put(
        `/api/admin/avaliacoes/${avaliacaoParaReprovar.id}/reprovar`,
        {
          motivo: motivoReprovacao.trim(),
        },
      );

      alert("Avaliação reprovada com sucesso!");
      setOpenReprovarModal(false);
      setAvaliacaoParaReprovar(null);
      setMotivoReprovacao("");
      carregarAvaliacoes();
    } catch (err: any) {
      alert(
        err.response?.data?.error?.includes("precisa ser resolvida")
          ? "A avaliação precisa ser resolvida primeiro."
          : "Erro ao reprovar avaliação.",
      );
    }
  };

  const resolverAvaliacao = (id: number) => {
    const avaliacao = avaliacoes.find((av) => av.id === id);
    if (avaliacao) abrirDialogResolucao(avaliacao);
  };

  // Filtros
  const handleFiltroStatusOperacionalChange = (event: SelectChangeEvent) => {
    setFiltroStatusOperacional(event.target.value);
  };

  const limparFiltros = () => {
    setFiltroStatusOperacional("todos");
    setFiltroProcessoAdmin("todos"); // Adicione esta linha para limpar o novo filtro
    setOrdenacao("nenhuma");
    setBusca("");
  };

  const alternarOrdenacao = () => {
    setOrdenacao((prev) =>
      prev === "nenhuma"
        ? "decrescente"
        : prev === "decrescente"
          ? "crescente"
          : "nenhuma",
    );
  };

  const getAvaliacoesProcessadas = () => {
    let result = [...avaliacoes];

    if (filtroStatusOperacional !== "todos") {
      result = result.filter(
        (av) =>
          (av.status_operacional || av.status) === filtroStatusOperacional,
      );
    }

    if (user?.role === "admin" && filtroProcessoAdmin !== "todos") {
      result = result.filter((av) => {
        const statusOp = av.status_operacional || av.status || "pendente";
        const statusAdm = av.status_admin || "pendente";

        switch (filtroProcessoAdmin) {
          case "aguardando_operacional":
            return statusOp === "pendente";
          case "pendente_aprovacao":
            return statusOp === "resolvido" && statusAdm === "pendente";
          case "aprovados":
            return statusAdm === "aprovado";
          case "reprovados":
            return statusAdm === "reprovado";
          default:
            return true;
        }
      });
    }

    if (busca) {
      const termo = busca.toLowerCase();
      result = result.filter(
        (av) =>
          av.cliente_email?.toLowerCase().includes(termo) ||
          av.cliente_nome?.toLowerCase().includes(termo) || // Adicionado busca por nome do cliente
          av.comentario?.toLowerCase().includes(termo) ||
          av.resolucao?.toLowerCase().includes(termo) ||
          av.usuario_nome?.toLowerCase().includes(termo) ||
          av.empresa_nome?.toLowerCase().includes(termo),
      );
    }

    if (ordenacao !== "nenhuma") {
      result.sort((a, b) =>
        ordenacao === "crescente" ? a.nota - b.nota : b.nota - a.nota,
      );
    }

    return result;
  };

  const getClassificacaoNPS = (nota: number) => {
    if (nota >= 9) return { label: "Promotor", color: "success" as const };
    if (nota >= 7) return { label: "Neutro", color: "warning" as const };
    return { label: "Detrator", color: "error" as const };
  };

  const getStatusOperacionalInfo = (status?: string) => {
    const st = status || "pendente";
    if (st === "resolvido")
      return { label: "Resolvido", color: "success" as const };
    if (st === "pendente")
      return { label: "Pendente", color: "warning" as const };
    return { label: st, color: "default" as const };
  };

  const getStatusAdminInfo = (status?: string) => {
    const st = status || "pendente";
    if (st === "aprovado")
      return { label: "Aprovado", color: "success" as const };
    if (st === "reprovado")
      return { label: "Reprovado", color: "error" as const };
    return { label: "Pendente", color: "default" as const };
  };

  const getStatusOperacionalIcon = (status?: string) =>
    (status || "pendente") === "resolvido" ? (
      <CheckCircleIcon fontSize="small" />
    ) : (
      <BuildIcon fontSize="small" />
    );

  const getStatusAdminIcon = (status?: string) => {
    const st = status || "pendente";
    if (st === "aprovado") return <ThumbUpIcon fontSize="small" />;
    if (st === "reprovado") return <ThumbDownIcon fontSize="small" />;
    return <GavelIcon fontSize="small" />;
  };

  const formatarData = (dataString: string) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return (
      data.toLocaleDateString("pt-BR") +
      " " +
      data.toLocaleTimeString("pt-BR").slice(0, 5)
    );
  };

  // FUNÇÃO DE EXPORTAÇÃO CSV
  const exportarParaCSV = () => {
    const avaliacoesParaExportar = getAvaliacoesProcessadas();

    if (avaliacoesParaExportar.length === 0) {
      alert("Nenhuma avaliação para exportar!");
      return;
    }

    // Cabeçalhos do CSV
    const headers = [
      "ID",
      "Cliente",
      "Email",
      "Nota",
      "Classificação NPS",
      "Colaborador",
      "ID Colaborador",
      "Empresa",
      "Status Operacional",
      "Status Admin",
      "Comentário do Cliente",
      "Resolução",
      "Comentário Admin",
      "Data Criação",
      "Data Atualização",
    ];

    // Converter dados para CSV
    const csvData = avaliacoesParaExportar.map((av) => [
      av.id,
      av.cliente_nome || "—",
      av.cliente_email || "—",
      av.nota,
      getClassificacaoNPS(av.nota).label,
      getNomeOperacional(av),
      av.usuario_id || "—",
      getNomeEmpresa(av),
      av.status_operacional || av.status || "pendente",
      av.status_admin || "pendente",
      `"${(av.comentario || "").replace(/"/g, '""')}"`,
      `"${(av.resolucao || "").replace(/"/g, '""')}"`,
      `"${(av.comentario_aprovacao || av.motivo_reprovacao || "").replace(/"/g, '""')}"`,
      formatarData(av.created_at),
      formatarData(av.updated_at),
    ]);

    // Criar conteúdo CSV
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // Criar e fazer download do arquivo
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const dataAtual = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `avaliacoes_${dataAtual}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(
      `✅ ${avaliacoesParaExportar.length} avaliações exportadas com sucesso!`,
    );
  };

  const avaliacoesFiltradas = getAvaliacoesProcessadas();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      {/* Cabeçalho da página */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            color="primary"
            gutterBottom
          >
            Avaliações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie e acompanhe todas as avaliações dos clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportarParaCSV}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            py: 1,
            boxShadow: 2,
          }}
        >
          Exportar CSV
        </Button>
      </Box>

      {/* Cards de resumo */}
      {/* Cards de resumo - Lógica de Funil/Processo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 1. Total (Geral) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
              color: "white",
              p: 2.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <AssessmentIcon sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Total Geral
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800}>
              {avaliacoes.length}
            </Typography>
          </Card>
        </Grid>

        {/* 2. Pendentes (Fase Operacional) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              background: "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
              color: "white",
              p: 2.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <PendingActionsIcon sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Pendentes (Op)
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800}>
              {
                avaliacoes.filter(
                  (av) => (av.status_operacional || av.status) === "pendente",
                ).length
              }
            </Typography>
          </Card>
        </Grid>

        {/* 3. Aguardando Aprovação (Fase Admin) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              background: "linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)",
              color: "white",
              p: 2.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <GavelIcon sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Para Aprovar
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800}>
              {
                avaliacoes.filter(
                  (av) =>
                    (av.status_operacional || av.status) === "resolvido" &&
                    av.status_admin === "pendente",
                ).length
              }
            </Typography>
          </Card>
        </Grid>

        {/* 4. Aprovadas (Finalizadas) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              background: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
              color: "white",
              p: 2.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <VerifiedIcon sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Finalizadas
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800}>
              {avaliacoes.filter((av) => av.status_admin === "aprovado").length}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Painel de Filtros */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
            Filtros e Busca
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2.5,
            }}
          >
            {/* Campo de busca */}
            <TextField
              placeholder="Buscar por cliente, operacional ou empresa..."
              variant="outlined"
              size="small"
              sx={{
                width: 320,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1.5, color: "text.secondary" }} />
                ),
              }}
            />

            {/* Filtro específico para o Admin - Visão de Funil (Pipeline) */}
            {user?.role === "admin" && (
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <GavelIcon sx={{ fontSize: 18 }} />
                  Estágio do Processo
                </InputLabel>
                <Select
                  value={filtroProcessoAdmin}
                  label="Estágio do Processo"
                  onChange={(e) => setFiltroProcessoAdmin(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="todos">Todos os registros</MenuItem>
                  <MenuItem value="aguardando_operacional">
                    1. Aguardando Resolução (Operacional)
                  </MenuItem>
                  <MenuItem value="pendente_aprovacao">
                    2. Pendente de minha Aprovação
                  </MenuItem>
                  <MenuItem value="aprovados">3. Aprovados</MenuItem>
                  <MenuItem value="reprovados">4. Reprovados</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Filtro mantido para o Operacional (sem mudanças no fluxo deles) */}
            {user?.role === "operacional" && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <BuildIcon sx={{ fontSize: 18 }} />
                  Status Operacional
                </InputLabel>
                <Select
                  value={filtroStatusOperacional}
                  label="Status Operacional"
                  onChange={handleFiltroStatusOperacionalChange}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="pendente">Pendente</MenuItem>
                  <MenuItem value="resolvido">Resolvido</MenuItem>
                </Select>
              </FormControl>
            )}

            <Tooltip
              title={`Ordenar por nota (${
                ordenacao === "crescente"
                  ? "Crescente"
                  : ordenacao === "decrescente"
                    ? "Decrescente"
                    : "Nenhuma"
              })`}
            >
              <Button
                variant={ordenacao !== "nenhuma" ? "contained" : "outlined"}
                startIcon={<SortIcon />}
                onClick={alternarOrdenacao}
                color={ordenacao !== "nenhuma" ? "primary" : "inherit"}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3,
                }}
              >
                Nota{" "}
                {ordenacao !== "nenhuma" &&
                  (ordenacao === "crescente" ? "↑" : "↓")}
              </Button>
            </Tooltip>

            {(filtroStatusOperacional !== "todos" ||
              filtroProcessoAdmin !== "todos" ||
              ordenacao !== "nenhuma" ||
              busca) && (
              <Tooltip title="Limpar filtros">
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ClearIcon />}
                  onClick={limparFiltros}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    borderColor: "divider",
                  }}
                >
                  Limpar
                </Button>
              </Tooltip>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                bgcolor: alpha("#1976d2", 0.08),
                px: 2,
                py: 1,
                borderRadius: 2,
                fontWeight: 500,
              }}
            >
              Mostrando <strong>{avaliacoesFiltradas.length}</strong> de{" "}
              <strong>{avaliacoes.length}</strong> avaliações
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {error}
        </Alert>
      )}

      {/* Cards de Avaliações Expandidas */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {avaliacoesFiltradas.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma avaliação encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tente ajustar seus filtros de busca
            </Typography>
          </Card>
        ) : (
          avaliacoesFiltradas.map((av) => {
            const statusOp = av.status_operacional || av.status || "pendente";
            const statusAdm = av.status_admin || "pendente";
            const nomeOp = getNomeOperacional(av);
            const nomeEmp = getNomeEmpresa(av);
            const iniciais = getIniciais(nomeOp);
            const corAvatar = getAvatarColor(av.usuario_id);

            return (
              <Card
                key={av.id}
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  },
                }}
              >
                {/* CABEÇALHO DO CARD - INFORMAÇÕES PRINCIPAIS */}
                <Box
                  sx={{
                    p: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderBottom: "1px solid",
                    borderBottomColor: "divider",
                    bgcolor: alpha("#1976d2", 0.02),
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={`#${av.id}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      />
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="primary"
                        >
                          {av.cliente_nome ||
                            av.cliente_email ||
                            "Cliente não informado"}
                        </Typography>
                        {av.cliente_nome && av.cliente_email && (
                          <Typography variant="body2" color="text.secondary">
                            {av.cliente_email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      <AccessTimeIcon
                        sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}
                      />
                      {formatarData(av.created_at)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 1,
                    }}
                  >
                    {/* NOTA E CLASSIFICAÇÃO */}
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          bgcolor: alpha("#1976d2", 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid",
                          borderColor: alpha("#1976d2", 0.3),
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="span"
                          fontWeight={800}
                        >
                          {av.nota}
                        </Typography>
                      </Box>
                      <Chip
                        label={getClassificacaoNPS(av.nota).label}
                        color={getClassificacaoNPS(av.nota).color}
                        size="medium"
                        sx={{ fontWeight: 600, borderRadius: 1.5 }}
                      />
                    </Box>

                    {/* STATUS */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip
                        icon={getStatusOperacionalIcon(statusOp)}
                        label={getStatusOperacionalInfo(statusOp).label}
                        color={getStatusOperacionalInfo(statusOp).color}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                      {user?.role === "admin" && (
                        <Chip
                          icon={getStatusAdminIcon(statusAdm)}
                          label={getStatusAdminInfo(statusAdm).label}
                          color={getStatusAdminInfo(statusAdm).color}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* INFORMAÇÕES DETALHADAS */}
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* COLABORADOR */}
                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            fontSize: 16,
                            bgcolor: corAvatar,
                            fontWeight: 600,
                          }}
                        >
                          {iniciais}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            COLABORADOR AVALIADO
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {av.usuario_id
                              ? `#${av.usuario_id} ${nomeOp}`
                              : nomeOp}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {nomeOp === "Não atribuído"
                              ? "Aguardando atribuição"
                              : "Colaborador"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* EMPRESA */}
                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <BusinessIcon
                          sx={{
                            color: "primary.main",
                            fontSize: 40,
                            bgcolor: alpha("#1976d2", 0.1),
                            p: 1,
                            borderRadius: 2,
                          }}
                        />
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            EMPRESA
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {nomeEmp}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Empresa que avaliou
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* COMENTÁRIOS - SEMPRE VISÍVEIS */}
                  {(av.comentario ||
                    av.resolucao ||
                    av.comentario_aprovacao ||
                    av.motivo_reprovacao) && (
                    <Box
                      sx={{
                        mt: 4,
                        pt: 3,
                        borderTop: "1px solid",
                        borderTopColor: "divider",
                      }}
                    >
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ mb: 2, color: "text.secondary" }}
                      >
                        Detalhes da Avaliação
                      </Typography>

                      {/* COMENTÁRIO DO CLIENTE */}
                      {av.comentario && (
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.5,
                            }}
                          >
                            <MessageIcon sx={{ color: "primary.main" }} />
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              color="primary"
                            >
                              COMENTÁRIO DO CLIENTE
                            </Typography>
                          </Box>
                          <Paper
                            sx={{
                              p: 3,
                              bgcolor: alpha("#1976d2", 0.03),
                              borderRadius: 2,
                              borderLeft: "4px solid",
                              borderLeftColor: "primary.main",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ fontStyle: "italic", lineHeight: 1.6 }}
                            >
                              "{av.comentario}"
                            </Typography>
                          </Paper>
                        </Box>
                      )}

                      {/* RESOLUÇÃO DO OPERACIONAL */}
                      {av.resolucao && (
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.5,
                            }}
                          >
                            <DescriptionIcon sx={{ color: "warning.main" }} />
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              color="warning.main"
                            >
                              RESOLUÇÃO DO OPERACIONAL
                            </Typography>
                          </Box>
                          <Paper
                            sx={{
                              p: 3,
                              bgcolor: alpha("#ff9800", 0.05),
                              borderRadius: 2,
                              borderLeft: "4px solid",
                              borderLeftColor: "warning.main",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                            >
                              {av.resolucao}
                            </Typography>
                          </Paper>
                        </Box>
                      )}

                      {/* COMENTÁRIO DO ADMIN */}
                      {(av.comentario_aprovacao || av.motivo_reprovacao) && (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.5,
                              color:
                                statusAdm === "aprovado"
                                  ? "success.main"
                                  : "error.main",
                            }}
                          >
                            <RateReviewIcon />
                            <Typography variant="subtitle1" fontWeight={700}>
                              AVALIAÇÃO DO ADMIN -{" "}
                              {statusAdm === "aprovado"
                                ? "APROVADO"
                                : "REPROVADO"}
                            </Typography>
                          </Box>
                          <Paper
                            sx={{
                              p: 3,
                              bgcolor:
                                statusAdm === "aprovado"
                                  ? alpha("#4caf50", 0.08)
                                  : alpha("#f44336", 0.08),
                              borderRadius: 2,
                              borderLeft: "4px solid",
                              borderLeftColor:
                                statusAdm === "aprovado"
                                  ? "success.main"
                                  : "error.main",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                            >
                              {av.comentario_aprovacao || av.motivo_reprovacao}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 2, display: "block" }}
                            >
                              Data da avaliação: {formatarData(av.updated_at)}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                {/* BOTÕES DE AÇÃO */}
                <Box
                  sx={{
                    p: 3,
                    pt: 0,
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                    borderTop: "1px solid",
                    borderTopColor: "divider",
                    bgcolor: alpha("#f5f5f5", 0.5),
                  }}
                >
                  {statusOp === "pendente" ? (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<BuildIcon />}
                      onClick={() => resolverAvaliacao(av.id)}
                      sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
                    >
                      Resolver Avaliação
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<VisibilityIcon />}
                      onClick={() => abrirDialogResolucao(av)}
                      sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
                    >
                      Ver Resolução
                    </Button>
                  )}

                  {/* AÇÕES DO ADMIN */}
                  {user?.role === "admin" && statusAdm === "pendente" && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => abrirModalAprovacao(av.id)}
                        disabled={statusOp !== "resolvido"}
                        sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => abrirModalReprovacao(av.id)}
                        disabled={statusOp !== "resolvido"}
                        sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
                      >
                        Reprovar
                      </Button>
                    </Box>
                  )}
                </Box>
              </Card>
            );
          })
        )}
      </Box>

      {/* Modal de Resolução */}
      <Dialog
        open={openResolucao}
        onClose={fecharDialogResolucao}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            fontWeight: 700,
            py: 3,
          }}
        >
          {avaliacaoSelecionada?.resolucao
            ? "Resolução da Avaliação"
            : "Adicionar Resolução"}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {avaliacaoSelecionada && (
            <>
              {/* Informações da avaliação */}
              <Card
                sx={{
                  mb: 4,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                        fontWeight={600}
                      >
                        COLABORADOR AVALIADO
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mt: 1,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: getAvatarColor(
                              avaliacaoSelecionada.usuario_id,
                            ),
                            fontWeight: 600,
                          }}
                        >
                          {getIniciais(
                            getNomeOperacional(avaliacaoSelecionada),
                          )}
                        </Avatar>
                        <Typography variant="body1" fontWeight={600}>
                          {getNomeOperacional(avaliacaoSelecionada)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                        fontWeight={600}
                      >
                        EMPRESA QUE AVALIOU
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mt: 1,
                        }}
                      >
                        <BusinessIcon
                          sx={{
                            color: "primary.main",
                            bgcolor: alpha("#1976d2", 0.1),
                            p: 0.75,
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body1" fontWeight={600}>
                          {getNomeEmpresa(avaliacaoSelecionada)}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* NOVA SEÇÃO: CLIENTE - Adicionada para mostrar nome do cliente */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                        fontWeight={600}
                      >
                        CLIENTE
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mt: 1,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: "#9c27b0",
                            fontWeight: 600,
                          }}
                        >
                          {avaliacaoSelecionada.cliente_nome
                            ? avaliacaoSelecionada.cliente_nome
                                .charAt(0)
                                .toUpperCase()
                            : "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {avaliacaoSelecionada.cliente_nome ||
                              "Não informado"}
                          </Typography>
                          {avaliacaoSelecionada.cliente_email && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {avaliacaoSelecionada.cliente_email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Nota e classificação */}
                  <Box
                    sx={{
                      mt: 3,
                      pt: 3,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                        fontWeight={600}
                      >
                        NOTA ATRIBUÍDA
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: "50%",
                            bgcolor: alpha("#1976d2", 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid",
                            borderColor: alpha("#1976d2", 0.3),
                          }}
                        >
                          <Typography
                            variant="h5"
                            component="span"
                            fontWeight={800}
                          >
                            {avaliacaoSelecionada.nota}
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            getClassificacaoNPS(avaliacaoSelecionada.nota).label
                          }
                          color={
                            getClassificacaoNPS(avaliacaoSelecionada.nota).color
                          }
                          size="medium"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 1.5,
                            px: 2,
                            py: 1.5,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Comentário do cliente */}
                  {avaliacaoSelecionada.comentario && (
                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                        fontWeight={600}
                      >
                        COMENTÁRIO DO CLIENTE:
                      </Typography>
                      <Box
                        sx={{
                          p: 3,
                          bgcolor: alpha("#1976d2", 0.03),
                          borderRadius: 2,
                          borderLeft: "4px solid",
                          borderLeftColor: "primary.main",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontStyle: "italic",
                            lineHeight: 1.7,
                          }}
                        >
                          "{avaliacaoSelecionada.comentario}"
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Campo para resolução */}
              <Typography variant="h6" gutterBottom fontWeight={600}>
                {avaliacaoSelecionada.resolucao
                  ? "Resolução atual:"
                  : "Adicionar resolução:"}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Resolução / Comentário interno"
                value={resolucaoText}
                onChange={(e) => setResolucaoText(e.target.value)}
                disabled={
                  user?.role !== "admin" &&
                  (avaliacaoSelecionada?.status_operacional === "resolvido" ||
                    avaliacaoSelecionada?.status === "resolvido")
                }
                variant="outlined"
                helperText="Mínimo 5 caracteres. Descreva a resolução do problema."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              {/* Comentário do admin se existir */}
              {(avaliacaoSelecionada.comentario_aprovacao ||
                avaliacaoSelecionada.motivo_reprovacao) && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    fontWeight={600}
                  >
                    COMENTÁRIO DO ADMINISTRADOR:
                  </Typography>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor:
                        avaliacaoSelecionada.status_admin === "aprovado"
                          ? alpha("#4caf50", 0.05)
                          : alpha("#f44336", 0.05),
                      borderRadius: 2,
                      borderLeft: `4px solid ${avaliacaoSelecionada.status_admin === "aprovado" ? "#4caf50" : "#f44336"}`,
                    }}
                  >
                    <Typography variant="body1">
                      {avaliacaoSelecionada.comentario_aprovacao ||
                        avaliacaoSelecionada.motivo_reprovacao}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={fecharDialogResolucao}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={salvarResolucao}
            disabled={!resolucaoText.trim() || resolucaoText.length < 5}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Salvar Resolução
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Aprovação */}
      <Dialog
        open={openAprovarModal}
        onClose={() => setOpenAprovarModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "success.main",
            color: "white",
            fontWeight: 700,
            py: 3,
          }}
        >
          <CheckCircleIcon sx={{ mr: 1.5, verticalAlign: "middle" }} />
          Aprovar Avaliação
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: alpha("#4caf50", 0.05),
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha("#4caf50", 0.2),
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Avaliação #{avaliacaoParaAprovar?.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente: {avaliacaoParaAprovar?.cliente_nome || "Não informado"}
              {avaliacaoParaAprovar?.cliente_email && (
                <>
                  <br />
                  Email: {avaliacaoParaAprovar.cliente_email}
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nota: {avaliacaoParaAprovar?.nota}
            </Typography>
          </Box>

          {avaliacaoParaAprovar?.resolucao && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                fontWeight={600}
              >
                Resolução do operacional:
              </Typography>
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: alpha("#ff9800", 0.05),
                  borderRadius: 2,
                  borderLeft: "4px solid",
                  borderLeftColor: "warning.main",
                }}
              >
                <Typography variant="body2">
                  {avaliacaoParaAprovar.resolucao}
                </Typography>
              </Box>
            </Box>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Comentário da aprovação (opcional)"
            fullWidth
            multiline
            rows={4}
            value={comentarioAprovacao}
            onChange={(e) => setComentarioAprovacao(e.target.value)}
            variant="outlined"
            helperText="Este comentário ficará visível para o operacional responsável"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={() => setOpenAprovarModal(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={confirmarAprovacao}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 2,
            }}
          >
            Confirmar Aprovação
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Reprovação */}
      <Dialog
        open={openReprovarModal}
        onClose={() => setOpenReprovarModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "error.main",
            color: "white",
            fontWeight: 700,
            py: 3,
          }}
        >
          <CancelIcon sx={{ mr: 1.5, verticalAlign: "middle" }} />
          Reprovar Avaliação
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: alpha("#f44336", 0.05),
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha("#f44336", 0.2),
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Avaliação #{avaliacaoParaReprovar?.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente: {avaliacaoParaReprovar?.cliente_nome || "Não informado"}
              {avaliacaoParaReprovar?.cliente_email && (
                <>
                  <br />
                  Email: {avaliacaoParaReprovar.cliente_email}
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nota: {avaliacaoParaReprovar?.nota}
            </Typography>
          </Box>

          {avaliacaoParaReprovar?.resolucao && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                fontWeight={600}
              >
                Resolução do operacional:
              </Typography>
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: alpha("#ff9800", 0.05),
                  borderRadius: 2,
                  borderLeft: "4px solid",
                  borderLeftColor: "warning.main",
                }}
              >
                <Typography variant="body2">
                  {avaliacaoParaReprovar.resolucao}
                </Typography>
              </Box>
            </Box>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Motivo da reprovação *"
            fullWidth
            multiline
            rows={4}
            value={motivoReprovacao}
            onChange={(e) => setMotivoReprovacao(e.target.value)}
            variant="outlined"
            helperText="Este comentário ficará visível para o operacional responsável (mínimo 5 caracteres)"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={() => setOpenReprovarModal(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarReprovacao}
            disabled={
              !motivoReprovacao.trim() || motivoReprovacao.trim().length < 5
            }
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 2,
            }}
          >
            Confirmar Reprovação
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
