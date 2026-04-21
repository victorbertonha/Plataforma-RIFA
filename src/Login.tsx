import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function signUp() {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "Cadastro feito! Verifique seu e-mail se exigir confirmação.");
  }

  async function signIn() {
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "Logado com sucesso!");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMsg("Saiu da conta.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", display: "grid", gap: 12 }}>
      <h1>Entrar</h1>

      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={signIn} disabled={loading}>
        {loading ? "..." : "Entrar"}
      </button>

      <button onClick={signUp} disabled={loading}>
        {loading ? "..." : "Criar conta"}
      </button>

      <button onClick={signOut} type="button">
        Sair
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
}