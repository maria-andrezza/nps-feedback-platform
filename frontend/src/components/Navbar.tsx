// src/components/Navbar.tsx - VERSÃO CORRIGIDA
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Chip, // ADICIONE ESTA LINHA!
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  ExitToApp as LogoutIcon,
  // Menu as MenuIcon, // REMOVA ESTA LINHA (não está sendo usada)
} from "@mui/icons-material";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Não mostrar navbar na página de login
  if (location.pathname === "/login") {
    return null;
  }

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        {/* LOGO/ÍCONE à esquerda */}
        <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
          <AssessmentIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            NPS System
          </Typography>
        </Box>

        {/* MENU DE NAVEGAÇÃO */}
        <Box sx={{ display: "flex", flexGrow: 1, gap: 1 }}>
          <Button
            startIcon={<DashboardIcon />}
            onClick={() => navigate("/dashboard")}
            color={isActive("/dashboard") ? "primary" : "inherit"}
            variant={isActive("/dashboard") ? "contained" : "text"}
            size="small"
          >
            Dashboard
          </Button>

          <Button
            startIcon={<AssessmentIcon />}
            onClick={() => navigate("/avaliacoes")}
            color={isActive("/avaliacoes") ? "primary" : "inherit"}
            variant={isActive("/avaliacoes") ? "contained" : "text"}
            size="small"
          >
            Avaliações
          </Button>

          {user?.role === "admin" && (
            <>
              <Button
                startIcon={<PeopleIcon />}
                onClick={() => navigate("/usuarios")}
                color={isActive("/usuarios") ? "primary" : "inherit"}
                variant={isActive("/usuarios") ? "contained" : "text"}
                size="small"
              >
                Usuários
              </Button>

              <Button
                startIcon={<BusinessIcon />}
                onClick={() => navigate("/empresas")}
                color={isActive("/empresas") ? "primary" : "inherit"}
                variant={isActive("/empresas") ? "contained" : "text"}
                size="small"
              >
                Empresas
              </Button>
            </>
          )}
        </Box>

        {/* PERFIL DO USUÁRIO à direita */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Olá, <strong>{user?.nome}</strong>
          </Typography>

          <Tooltip title="Perfil">
            <IconButton onClick={handleMenu} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                {user?.nome?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.nome}
                <br />
                <small>{user?.email}</small>
                <br />
                <Chip
                  label={
                    user?.role === "admin" ? "Administrador" : "Operacional"
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Sair
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
