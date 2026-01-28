import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import api from "../services/api";

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
  email?: string;
}

export default function PesquisaFeedback() {
  // Use apenas 'empresaId' como parâmetro
  const { empresaId } = useParams<{ empresaId: string }>();
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [funcionarioId, setFuncionarioId] = useState<number | "">("");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState<string>("");
  const [clienteNome, setClienteNome] = useState("");

  // Buscar funcionários da empresa - VERSÃO CORRIGIDA
  useEffect(() => {
    if (!empresaId || isNaN(Number(empresaId))) {
      setError("ID da empresa inválido!");
      setLoading(false);
      return;
    }

    const carregarDados = async () => {
      try {
        setLoading(true);
        console.log("🔍 Buscando dados da empresa:", empresaId);

        // 1. Buscar nome da empresa
        try {
          const empresaRes = await api.get(`/api/empresas/${empresaId}/info`);
          if (empresaRes.data.success && empresaRes.data.empresa) {
            setEmpresaNome(
              empresaRes.data.empresa.nome || `Empresa ${empresaId}`,
            );
          } else {
            setEmpresaNome(`Empresa ${empresaId}`);
          }
        } catch {
          setEmpresaNome(`Empresa ${empresaId}`);
        }

        // 2. Buscar funcionários - COM TRATAMENTO PARA ERRO 401
        let operacionaisEncontrados = [];

        try {
          // Tenta buscar da rota protegida
          const response = await api.get("/api/admin/usuarios");

          if (response.data.success && response.data.usuarios) {
            operacionaisEncontrados = response.data.usuarios.filter(
              (u: any) => u.role === "operacional",
            );

            console.log(
              `✅ ${operacionaisEncontrados.length} operacionais encontrados (via admin)`,
            );
          }
        } catch (err: any) {
          // SE FOR ERRO 401 (não autenticado) ou qualquer erro
          console.log(
            "ℹ️ Usando operacionais padrão:",
            err.response?.status || err.message,
          );

          // FALLBACK: Usa lista padrão de operacionais
          // ATENÇÃO: Use IDs que existem no seu banco!
          operacionaisEncontrados = [
            { id: 2, nome: "João Silva", cargo: "Atendente" },
            { id: 3, nome: "Maria Santos", cargo: "Atendente" },
            { id: 4, nome: "Carlos Oliveira", cargo: "Atendente" },
            { id: 5, nome: "João Operacional", cargo: "Atendente" },
            { id: 10, nome: "Operacional Teste", cargo: "Atendente" },
          ];
        }

        // Transformar dados para o formato esperado
        setFuncionarios(
          operacionaisEncontrados.map((u: any) => ({
            id: u.id,
            nome: u.nome || "Funcionário",
            cargo: u.cargo || u.role || "Atendente",
            email: u.email,
          })),
        );

        // Auto-selecionar se houver apenas um
        if (operacionaisEncontrados.length === 1) {
          setFuncionarioId(operacionaisEncontrados[0].id);
        }
      } catch (err: any) {
        console.error("❌ Erro ao carregar dados:", err);
        setError("Não foi possível carregar alguns dados da pesquisa.");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [empresaId]);

  const getEmoji = (n: number) => {
    if (n >= 9) return "🤩";
    if (n >= 7) return "🙂";
    if (n >= 5) return "😐";
    return "😡";
  };

  const getCorNota = (n: number) => {
    if (n >= 9) return "#4CAF50"; // Verde
    if (n >= 7) return "#8BC34A"; // Verde claro
    if (n >= 5) return "#FFC107"; // Amarelo
    if (n >= 3) return "#FF9800"; // Laranja
    return "#F44336"; // Vermelho
  };

  const handleSubmit = async () => {
    if (nota === null) {
      return alert("Por favor, selecione uma nota de 0 a 10.");
    }

    if (funcionarioId === "" || funcionarioId === null) {
      return alert("Por favor, selecione o funcionário que te atendeu.");
    }

    if (!empresaId || isNaN(Number(empresaId))) {
      return alert("ID da empresa inválido!");
    }

    try {
      // Crie o objeto de dados
      const dadosParaEnviar: any = {
        empresa_id: Number(empresaId),
        nota,
        comentario: comentario || "",
        cliente_email: "", // Campo vazio
        usuario_id: funcionarioId,
      };

      // Adicione cliente_nome apenas se não estiver vazio
      if (clienteNome && clienteNome.trim() !== "") {
        dadosParaEnviar.cliente_nome = clienteNome.trim();
      }

      console.log("📤 Enviando pesquisa:", dadosParaEnviar);

      const response = await api.post("/api/public/feedback", dadosParaEnviar);

      console.log("✅ Resposta da API:", response.data);

      if (response.data.success) {
        setEnviado(true);
      } else {
        alert(response.data.error || "Erro ao enviar pesquisa");
      }
    } catch (err: any) {
      console.error("❌ Erro ao enviar pesquisa:", err);
      console.error("Detalhes do erro:", err.response?.data);

      // Tratamento de erro seguro
      if (err.response?.data?.error?.includes("cliente_nome")) {
        // Se o erro for sobre cliente_nome, tente sem o campo
        console.log("⚠️ Campo cliente_nome não suportado, tentando sem...");

        const dadosSemNome = {
          empresa_id: Number(empresaId),
          nota,
          comentario: comentario || "",
          cliente_email: "",
          usuario_id: funcionarioId,
        };

        try {
          const response = await api.post("/api/public/feedback", dadosSemNome);
          if (response.data.success) {
            setEnviado(true);
            return;
          }
        } catch (retryErr) {
          // Continua com o erro original
          console.error("❌ Erro ao tentar sem cliente_nome:", retryErr);
        }
      }

      // Mensagem mais amigável para o usuário
      const errorMessage = err.response?.data?.error
        ? `Erro: ${err.response.data.error}`
        : "Ocorreu um erro ao enviar sua pesquisa. Por favor, tente novamente.";

      alert(errorMessage);
    }
  };

  if (enviado) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
        <Paper
          sx={{
            p: 6,
            bgcolor: "background.paper",
            textAlign: "center",
            borderRadius: 4,
            boxShadow: 3,
          }}
        >
          <Typography
            variant="h1"
            sx={{ fontSize: "5rem", mb: 3, color: "success.main" }}
          >
            ✅
          </Typography>

          <Typography variant="h4" color="primary.main" gutterBottom>
            Pesquisa enviada com sucesso!
          </Typography>

          <Typography variant="h6" sx={{ my: 3, color: "text.secondary" }}>
            Muito obrigado por sua avaliação!
          </Typography>

          <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
            Sua opinião é muito importante para melhorarmos nossos serviços.
          </Typography>

          <Box
            sx={{
              mt: 4,
              pt: 4,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              • Pesquisa anônima •<br />• Dados utilizados apenas para melhorias
              •
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!empresaId) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
        <Typography variant="h4" color="error" gutterBottom>
          Link de pesquisa inválido!
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Certifique-se de usar o link completo da pesquisa.
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress color="primary" />
        <Typography sx={{ ml: 2 }}>Carregando pesquisa...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", py: 8, bgcolor: "background.default" }}>
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 4,
            boxShadow: 3,
          }}
        >
          {/* Cabeçalho */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" color="primary.main" sx={{ mb: 1 }}>
              {empresaNome}
            </Typography>
            <Typography
              variant="h4"
              gutterBottom
              fontWeight="bold"
              color="text.primary"
            >
              Pesquisa de Satisfação
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avalie sua experiência com nosso atendimento
            </Typography>
          </Box>

          {/* Emoji da nota */}
          <Typography variant="h1" sx={{ my: 4, fontSize: "4rem" }}>
            {nota !== null ? getEmoji(nota) : "🤔"}
          </Typography>

          {/* Instrução */}
          <Typography variant="h6" sx={{ mb: 3 }} color="text.primary">
            De 0 a 10, quanto você recomenda nosso serviço?
          </Typography>

          {/* Botões de nota */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ mb: 4 }}
          >
            {[...Array(11).keys()].map((n) => (
              <Button
                key={n}
                variant={nota === n ? "contained" : "outlined"}
                onClick={() => setNota(n)}
                sx={{
                  minWidth: "50px",
                  height: "50px",
                  color: nota === n ? "white" : "inherit",
                  borderColor: nota === n ? getCorNota(n) : "primary.main",
                  mb: 1,
                  fontSize: "1.2rem",
                  fontWeight: nota === n ? "bold" : "normal",
                  bgcolor: nota === n ? getCorNota(n) : "transparent",
                  "&:hover": {
                    bgcolor: nota === n ? getCorNota(n) : "action.hover",
                    borderColor: getCorNota(n),
                  },
                }}
              >
                {n}
              </Button>
            ))}
          </Stack>

          {/* Campo do nome do cliente - NOVO */}
          <TextField
            fullWidth
            label="Seu nome (opcional)"
            placeholder="Como gostaria de ser chamado?"
            variant="outlined"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* Mensagem de erro */}
          {error && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Seletor de funcionário */}
          {funcionarios.length > 0 && (
            <FormControl
              fullWidth
              sx={{
                mb: 3,
              }}
            >
              <InputLabel>Quem te atendeu? *</InputLabel>
              <Select
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value as number)}
                label="Quem te atendeu? *"
                sx={{
                  textAlign: "left",
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>Selecione um funcionário</em>
                </MenuItem>
                {funcionarios.map((func) => (
                  <MenuItem key={func.id} value={func.id}>
                    <Box sx={{ display: "flex", alignItems: "center", py: 1 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          mr: 2,
                          bgcolor: "primary.main",
                          fontSize: "1rem",
                        }}
                      >
                        {func.nome.charAt(0)}
                      </Avatar>
                      <Box sx={{ textAlign: "left" }}>
                        <Typography variant="body1">{func.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {func.cargo}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Campo de comentário */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comentários (opcional)"
            placeholder="O que podemos fazer para melhorar?"
            variant="outlined"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            sx={{
              mb: 4,
            }}
          />

          {/* Botão de enviar */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            onClick={handleSubmit}
            disabled={
              nota === null || (funcionarios.length > 0 && funcionarioId === "")
            }
            sx={{
              py: 2,
              fontWeight: "bold",
              fontSize: "1.1rem",
              bgcolor: nota !== null ? getCorNota(nota) : "primary.main",
              "&:hover": {
                bgcolor: nota !== null ? getCorNota(nota) : "primary.dark",
                opacity: 0.9,
              },
              "&:disabled": {
                bgcolor: "action.disabledBackground",
                color: "action.disabled",
              },
            }}
          >
            {nota === null ? "Selecione uma nota" : `Enviar Avaliação ${nota}`}
          </Button>

          {/* Legenda das notas */}
          <Box
            sx={{
              mt: 4,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Classificação:
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              flexWrap="wrap"
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "#F44336",
                    mr: 1,
                    borderRadius: "2px",
                  }}
                />
                <Typography variant="caption">0-4: Insatisfeito</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "#FF9800",
                    mr: 1,
                    borderRadius: "2px",
                  }}
                />
                <Typography variant="caption">5-6: Neutro</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "#FFC107",
                    mr: 1,
                    borderRadius: "2px",
                  }}
                />
                <Typography variant="caption">7-8: Satisfeito</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "#4CAF50",
                    mr: 1,
                    borderRadius: "2px",
                  }}
                />
                <Typography variant="caption">9-10: Excelente</Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* Rodapé */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3, textAlign: "center" }}
        >
          Pesquisa anônima • Dados utilizados apenas para melhorias no
          atendimento
        </Typography>
      </Container>
    </Box>
  );
}
