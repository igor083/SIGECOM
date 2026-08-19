"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { mensagemDeErro } from "@/lib/apiError";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email.trim(), senha);
      router.replace("/");
    } catch (err) {
      setErro(mensagemDeErro(err, "E-mail ou senha incorretos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "360px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1
            style={{
              color: "var(--color-primary)",
              fontSize: "1.6rem",
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            SIGECOM
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: "6px 0 0" }}>
            Bem-vindo
          </p>
        </div>

        {erro && (
          <Alert severity="error" sx={{ mb: 2, fontSize: "0.8rem" }}>
            {erro}
          </Alert>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <TextField
            label="Email"
            type="email"
            placeholder="exemplo@teste.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={enviando}
            required
            fullWidth
            size="small"
            sx={{
              background: "white",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
          />

          <TextField
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={enviando}
            required
            fullWidth
            size="small"
            sx={{
              background: "white",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={enviando || !email || !senha}
            sx={{
              mt: 0.5,
              py: 1.25,
              fontSize: "0.9rem",
              fontWeight: 700,
              borderRadius: "8px",
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            {enviando ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
