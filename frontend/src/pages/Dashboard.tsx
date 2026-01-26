// src/pages/Dashboard.tsx - APENAS EMOJI NO TÍTULO
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  Avatar,
} from "@mui/material";
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  People,
  ThumbUp,
  EmojiEvents,
  Person,
} from "@mui/icons-material";
import api from "../services/api";

interface Estatisticas {
  total_avaliacoes: number;
  promotores: number;
  neutros: number;
  detratores: number;
  media_geral: number;
  nps_score: number;
  resolvidos: number;
  pendentes: number;
  aprovados: number;
  reprovados: number;
  rankings?: {
    empresas: Array<{
      id: number;
      nome: string;
      total_avaliacoes: number;
      media_nota: number | string;
    }>;
    atualizado_em: string;
  };
}

interface EmpresaRanking {
  id: number;
  nome: string;
  total_avaliacoes: number;
  media_nota: number | string;
}

interface OperacionalStats {
  id: number;
  nome: string;
  total_avaliacoes: number;
  media_nota: number;
  nps_pessoal?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [rankingOperacionais, setRankingOperacionais] = useState<
    OperacionalStats[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    carregarEstatisticas();
    carregarRankingOperacionais();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const response = await api.get("/api/estatisticas");

      if (response.data.success) {
        const dadosConvertidos = {
          ...response.data.estatisticas,
          rankings: response.data.rankings
            ? {
                ...response.data.rankings,
                empresas:
                  response.data.rankings.empresas?.map(
                    (emp: EmpresaRanking) => ({
                      ...emp,
                      media_nota:
                        typeof emp.media_nota === "string"
                          ? parseFloat(emp.media_nota) || 0
                          : emp.media_nota || 0,
                    }),
                  ) || [],
              }
            : undefined,
        };

        setEstatisticas(dadosConvertidos);
      }
    } catch (err: any) {
      console.error("❌ Erro ao carregar estatísticas:", err);
      const errorMsg =
        err.response?.data?.error || "Erro ao carregar estatísticas";
      setError(errorMsg);

      setEstatisticas({
        total_avaliacoes: 18,
        promotores: 4,
        neutros: 6,
        detratores: 8,
        media_geral: 6.8,
        nps_score: -5.6,
        resolvidos: 14,
        pendentes: 2,
        aprovados: 10,
        reprovados: 4,
        rankings: {
          empresas: [],
          atualizado_em: new Date().toISOString(),
        },
      });
    }
  };

  const carregarRankingOperacionais = async () => {
    try {
      // Carregar ranking dos operacionais
      const response = await api.get("/api/admin/relatorios");

      if (response.data.success && response.data.relatorios?.top_atendentes) {
        const operacionais = response.data.relatorios.top_atendentes.map(
          (atendente: any) => ({
            id: atendente.id || Math.random(),
            nome: atendente.nome,
            total_avaliacoes: parseInt(atendente.total_avaliacoes) || 0,
            media_nota: parseFloat(atendente.media_nota) || 0,
            nps_pessoal: parseFloat(atendente.nps_pessoal) || 0,
          }),
        );

        setRankingOperacionais(operacionais);
      } else {
        // Dados mock para operacionais
        const mockOperacionais: OperacionalStats[] = [
          {
            id: 1,
            nome: "João Silva",
            total_avaliacoes: 45,
            media_nota: 8.9,
            nps_pessoal: 42.5,
          },
          {
            id: 2,
            nome: "Maria Santos",
            total_avaliacoes: 38,
            media_nota: 7.2,
            nps_pessoal: 28.9,
          },
          {
            id: 3,
            nome: "Carlos Oliveira",
            total_avaliacoes: 32,
            media_nota: 6.8,
            nps_pessoal: 18.4,
          },
          {
            id: 4,
            nome: "João Operacional",
            total_avaliacoes: 25,
            media_nota: 8.1,
            nps_pessoal: 35.2,
          },
          {
            id: 5,
            nome: "Operacional Teste",
            total_avaliacoes: 18,
            media_nota: 7.5,
            nps_pessoal: 24.7,
          },
        ];
        setRankingOperacionais(mockOperacionais);
      }
    } catch (err: any) {
      console.error("❌ Erro ao carregar ranking de operacionais:", err);
      // Dados mock em caso de erro
      const mockOperacionais: OperacionalStats[] = [
        {
          id: 1,
          nome: "João Silva",
          total_avaliacoes: 4,
          media_nota: 8.5,
          nps_pessoal: 50.0,
        },
        {
          id: 2,
          nome: "Carlos Oliveira",
          total_avaliacoes: 3,
          media_nota: 8.0,
          nps_pessoal: 33.3,
        },
        {
          id: 3,
          nome: "João Operacional",
          total_avaliacoes: 3,
          media_nota: 7.3,
          nps_pessoal: 0.0,
        },
        {
          id: 4,
          nome: "Anderson teste",
          total_avaliacoes: 2,
          media_nota: 5.5,
          nps_pessoal: -100.0,
        },
        {
          id: 5,
          nome: "Maria Santos",
          total_avaliacoes: 4,
          media_nota: 5.3,
          nps_pessoal: -50.0,
        },
      ];
      setRankingOperacionais(mockOperacionais);
    } finally {
      setLoading(false);
    }
  };

  const calcularPorcentagem = (valor: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  };

  const getNumero = (valor: any): number => {
    if (valor === null || valor === undefined) return 0;
    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num;
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

  // Calcular média das notas dos operacionais
  const mediaNotaOperacionais =
    rankingOperacionais.length > 0
      ? rankingOperacionais.reduce((sum, op) => sum + op.media_nota, 0) /
        rankingOperacionais.length
      : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Bem-vindo, {user?.nome}! Aqui está o resumo do sistema.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* SEÇÃO 1: Cartões de Métricas Principais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Avaliações
                  </Typography>
                  <Typography variant="h4">
                    {estatisticas?.total_avaliacoes || 0}
                  </Typography>
                </Box>
                <Assessment color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Score NPS
                  </Typography>
                  <Typography variant="h4">
                    {getNumero(estatisticas?.nps_score).toFixed(1)}%
                  </Typography>
                </Box>
                <TrendingUp
                  color={
                    getNumero(estatisticas?.nps_score) > 0 ? "success" : "error"
                  }
                  sx={{ fontSize: 40 }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  100,
                  Math.abs(getNumero(estatisticas?.nps_score)),
                )}
                color={
                  getNumero(estatisticas?.nps_score) > 0 ? "success" : "error"
                }
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Média Geral
                  </Typography>
                  <Typography variant="h4">
                    {getNumero(estatisticas?.media_geral).toFixed(1)}/10
                  </Typography>
                </Box>
                <People color="info" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={getNumero(estatisticas?.media_geral) * 10}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Resolvidos
                  </Typography>
                  <Typography variant="h4">
                    {estatisticas?.resolvidos || 0}
                  </Typography>
                </Box>
                <ThumbUp color="success" sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="caption" color="textSecondary">
                {calcularPorcentagem(
                  estatisticas?.resolvidos || 0,
                  estatisticas?.total_avaliacoes || 1,
                )}
                % do total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SEÇÃO 2: RANKINGS - EMPRESAS E OPERACIONAIS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Ranking das Empresas - APENAS EMOJI NO TÍTULO */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <EmojiEvents color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Ranking das Empresas</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {estatisticas?.rankings?.empresas &&
            estatisticas.rankings.empresas.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {estatisticas.rankings.empresas
                  .slice(0, 5)
                  .map((empresa, index) => {
                    const mediaNota = getNumero(empresa.media_nota);

                    return (
                      <Card key={empresa.id} variant="outlined" sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor:
                                    index < 3
                                      ? index === 0
                                        ? "gold"
                                        : index === 1
                                          ? "silver"
                                          : "#CD7F32"
                                      : "primary.main",
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                {index + 1} {/* APENAS NÚMERO NO AVATAR */}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="medium"
                                >
                                  {empresa.nome}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  {empresa.total_avaliacoes || 0} avaliações
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="h5" color="primary.main">
                                {mediaNota.toFixed(1)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                nota média
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={mediaNota * 10}
                              sx={{ height: 6, borderRadius: 3 }}
                              color={
                                mediaNota >= 8
                                  ? "success"
                                  : mediaNota >= 6
                                    ? "warning"
                                    : "error"
                              }
                            />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {mediaNota >= 8
                                  ? "Excelente"
                                  : mediaNota >= 6
                                    ? "Bom"
                                    : "Melhorar"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {mediaNota.toFixed(1)}/10
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
              </Box>
            ) : (
              <Alert severity="info">
                Nenhuma empresa com avaliações suficientes para ranking.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Ranking dos Operacionais - APENAS EMOJI NO TÍTULO */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Person color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Top Atendentes</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {rankingOperacionais.length > 0 ? (
              <>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {rankingOperacionais.slice(0, 5).map((operacional, index) => (
                    <Card
                      key={operacional.id}
                      variant="outlined"
                      sx={{ mb: 1 }}
                    >
                      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor:
                                  index < 3
                                    ? index === 0
                                      ? "gold"
                                      : index === 1
                                        ? "silver"
                                        : "#CD7F32"
                                    : "primary.main",
                                width: 36,
                                height: 36,
                              }}
                            >
                              {index + 1} {/* APENAS NÚMERO NO AVATAR */}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle1"
                                fontWeight="medium"
                              >
                                {operacional.nome}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {operacional.total_avaliacoes} avaliações
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h5" color="primary.main">
                              {operacional.media_nota.toFixed(1)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              nota média
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Chip
                            label={`NPS: ${operacional.nps_pessoal && operacional.nps_pessoal > 0 ? "+" : ""}${operacional.nps_pessoal?.toFixed(1) || "0.0"}%`}
                            color={
                              operacional.nps_pessoal &&
                              operacional.nps_pessoal > 0
                                ? "success"
                                : operacional.nps_pessoal &&
                                    operacional.nps_pessoal < 0
                                  ? "error"
                                  : "warning"
                            }
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={
                              operacional.media_nota >= 8
                                ? "Excelente"
                                : operacional.media_nota >= 6
                                  ? "Bom"
                                  : "Melhorar"
                            }
                            color={
                              operacional.media_nota >= 8
                                ? "success"
                                : operacional.media_nota >= 6
                                  ? "warning"
                                  : "error"
                            }
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                {/* MÉDIA DAS NOTAS */}
                <Divider sx={{ my: 3 }} />
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    display="block"
                  >
                    Média das Notas (Top 5)
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {mediaNotaOperacionais.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    em 10 pontos
                  </Typography>
                </Box>
              </>
            ) : (
              <Alert severity="info">
                Nenhum operacional com avaliações suficientes para ranking.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* SEÇÃO 3: Distribuição NPS e Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribuição NPS
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Promotores (9-10)</Typography>
                <Typography variant="body2">
                  {estatisticas?.promotores || 0} (
                  {calcularPorcentagem(
                    estatisticas?.promotores || 0,
                    estatisticas?.total_avaliacoes || 1,
                  )}
                  %)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={calcularPorcentagem(
                  estatisticas?.promotores || 0,
                  estatisticas?.total_avaliacoes || 1,
                )}
                color="success"
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Neutros (7-8)</Typography>
                <Typography variant="body2">
                  {estatisticas?.neutros || 0} (
                  {calcularPorcentagem(
                    estatisticas?.neutros || 0,
                    estatisticas?.total_avaliacoes || 1,
                  )}
                  %)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={calcularPorcentagem(
                  estatisticas?.neutros || 0,
                  estatisticas?.total_avaliacoes || 1,
                )}
                color="warning"
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Detratores (0-6)</Typography>
                <Typography variant="body2">
                  {estatisticas?.detratores || 0} (
                  {calcularPorcentagem(
                    estatisticas?.detratores || 0,
                    estatisticas?.total_avaliacoes || 1,
                  )}
                  %)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={calcularPorcentagem(
                  estatisticas?.detratores || 0,
                  estatisticas?.total_avaliacoes || 1,
                )}
                color="error"
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Status das Avaliações
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                {
                  label: "Pendentes",
                  value: estatisticas?.pendentes,
                  color: "warning" as const,
                  desc: "Aguardando ação",
                },
                {
                  label: "Aprovados",
                  value: estatisticas?.aprovados,
                  color: "info" as const,
                  desc: "Validação concluída",
                },
                {
                  label: "Resolvidos",
                  value: estatisticas?.resolvidos,
                  color: "success" as const,
                  desc: "Com solução registrada",
                },
                {
                  label: "Reprovados",
                  value: estatisticas?.reprovados,
                  color: "error" as const,
                  desc: "Não aprovados",
                },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={item.label}
                      color={item.color}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="body2">{item.value || 0}</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Ações Rápidas */}
            {user?.role === "operacional" && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Ações Rápidas
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => (window.location.href = "/avaliacoes")}
                >
                  Ver minhas avaliações
                </Button>
              </Box>
            )}

            {user?.role === "admin" && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Ações Rápidas
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => (window.location.href = "/avaliacoes")}
                >
                  Ver todas avaliações
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => (window.location.href = "/usuarios")}
                >
                  Gerenciar usuários
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* SEÇÃO 4: Informações Adicionais */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sobre o NPS (Net Promoter Score)
        </Typography>
        <Typography variant="body2" paragraph>
          O NPS é calculado subtraindo a porcentagem de detratores da
          porcentagem de promotores. Um score positivo indica mais promotores
          que detratores.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip
            icon={<TrendingUp />}
            label="Score positivo: Bom desempenho"
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<TrendingDown />}
            label="Score negativo: Precisa melhorar"
            color="error"
            variant="outlined"
          />
          <Chip
            label={`Score atual: ${getNumero(estatisticas?.nps_score).toFixed(1)}%`}
            color={getNumero(estatisticas?.nps_score) > 0 ? "success" : "error"}
          />
        </Box>
      </Paper>
    </Container>
  );
}
