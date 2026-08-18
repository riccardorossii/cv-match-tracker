"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Controlla la tua email per confermare la registrazione, poi accedi."
        );
        setMode("signin");
      }
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--surface-raised)",
              border: "1px solid var(--hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--amber)",
            }}
          >
            <Radar size={18} />
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            Match & Tracker
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 22,
            background: "var(--surface-raised)",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
                setMessage("");
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                background: mode === m ? "var(--amber)" : "transparent",
                color: mode === m ? "#1B1408" : "var(--muted)",
              }}
            >
              {m === "signin" ? "Accedi" : "Registrati"}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min. 6 caratteri)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--coral)",
                fontSize: 12.5,
              }}
            >
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {message && (
            <div style={{ color: "var(--teal)", fontSize: 12.5 }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: "var(--amber)",
              color: "#1B1408",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="spin" />
            ) : mode === "signin" ? (
              "Accedi"
            ) : (
              "Crea account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--text)",
  fontFamily: "'Inter', sans-serif",
  fontSize: 13.5,
  outline: "none",
};
