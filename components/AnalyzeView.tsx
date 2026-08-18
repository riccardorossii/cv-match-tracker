"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Briefcase,
  Plus,
  X,
  Check,
  Loader2,
  Upload,
  FileUp,
  AlertCircle,
  Radar,
  Compass,
  ExternalLink,
} from "lucide-react";
import MatchGauge, { scoreColor } from "./MatchGauge";
import type { Status } from "@/lib/types";

const T = {
  surface: "#1B2540",
  surfaceRaised: "#212C4B",
  hairline: "#2E3A57",
  text: "#EDEFF5",
  muted: "#8D97B0",
  faint: "#5C6786",
  amber: "#F2A93B",
  teal: "#3FB8AF",
  coral: "#E5573F",
  blue: "#5B8DEF",
};

interface MatchResult {
  matchScore: number;
  verdict: string;
  matchingSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

interface RoleResult {
  suggestedTitles: string[];
  realOpenings: { title: string; company: string; location: string; url: string }[];
}

export default function AnalyzeView({
  onSave,
}: {
  onSave: (app: {
    company: string;
    role: string;
    status: Status;
    match_score: number;
  }) => Promise<void>;
}) {
  const [cvFile, setCvFile] = useState<{ name: string; sizeKb: number; base64: string } | null>(
    null
  );
  const [cvError, setCvError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [saved, setSaved] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [roleResult, setRoleResult] = useState<RoleResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAnalyze = !!cvFile && jd.trim().length > 30 && !loading;

  function handleFileSelect(file: File | undefined | null) {
    setCvError("");
    if (!file) return;
    if (file.type !== "application/pdf") {
      setCvError("Carica un file in formato PDF.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setCvError("Il file supera i 15MB.");
      return;
    }
    setRoleResult(null);
    setRoleError("");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setCvFile({ name: file.name, sizeKb: Math.round(file.size / 1024), base64 });
    };
    reader.onerror = () => setCvError("Non sono riuscito a leggere il file.");
    reader.readAsDataURL(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  }

  async function analyze() {
    if (!cvFile) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvBase64: cvFile.base64, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante l'analisi.");
      setResult(data);
    } catch (e) {
      setError("Non sono riuscito a completare l'analisi. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  }

  async function suggestRoles() {
    if (!cvFile) return;
    setRoleLoading(true);
    setRoleError("");
    setRoleResult(null);
    try {
      const res = await fetch("/api/suggest-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvBase64: cvFile.base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante la ricerca.");
      setRoleResult(data);
    } catch (e) {
      setRoleError("Non sono riuscito a trovare ruoli affini. Riprova tra poco.");
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleSave() {
    if (!company.trim() || !role.trim() || !result) return;
    await onSave({
      company: company.trim(),
      role: role.trim(),
      status: "inviata",
      match_score: result.matchScore,
    });
    setSaved(true);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        className="analyze-grid"
      >
        <div>
          <label style={labelStyle}>
            <FileText size={13} /> Il tuo CV (PDF)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            style={{ display: "none" }}
          />
          {!cvFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                ...textareaStyle,
                height: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "pointer",
                borderStyle: "dashed",
                borderColor: isDragging ? T.amber : T.hairline,
                background: isDragging ? `${T.amber}0f` : T.surface,
                color: T.muted,
              }}
            >
              <Upload size={22} style={{ color: isDragging ? T.amber : T.faint }} />
              <span style={{ fontSize: 13.5 }}>
                {isDragging ? "Rilascia il file qui" : "Clicca o trascina qui il CV in PDF"}
              </span>
              <span style={{ fontSize: 11.5, color: T.faint }}>Max 15MB</span>
            </button>
          ) : (
            <div
              style={{
                ...textareaStyle,
                height: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textAlign: "center",
              }}
            >
              <FileUp size={26} style={{ color: T.amber }} />
              <div style={{ color: T.text, fontSize: 13.5, wordBreak: "break-all", padding: "0 10px" }}>
                {cvFile.name}
              </div>
              <div style={{ color: T.faint, fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace" }}>
                {cvFile.sizeKb} KB
              </div>
              <button
                onClick={() => {
                  setCvFile(null);
                  setRoleResult(null);
                  setRoleError("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: `1px solid ${T.hairline}`,
                  borderRadius: 8,
                  padding: "5px 11px",
                  color: T.muted,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <X size={12} /> Rimuovi e carica un altro file
              </button>
            </div>
          )}
          {cvError && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: T.coral, fontSize: 12.5 }}>
              <AlertCircle size={13} /> {cvError}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            <Briefcase size={13} /> Job description
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Incolla qui il testo dell'annuncio di lavoro..."
            style={textareaStyle}
          />
        </div>
      </div>

      {cvFile && (
        <div style={{ border: `1px solid ${T.hairline}`, borderRadius: 14, background: T.surface, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14.5, fontWeight: 600, color: T.text }}>
                <Compass size={15} style={{ color: T.blue }} /> Ruoli affini
              </div>
              <div style={{ fontSize: 12.5, color: T.faint, marginTop: 3 }}>
                Basati sul profilo del CV caricato, indipendentemente dall'annuncio qui sopra.
              </div>
            </div>
            <button
              onClick={suggestRoles}
              disabled={roleLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                padding: "9px 16px",
                borderRadius: 8,
                border: `1px solid ${T.blue}66`,
                cursor: roleLoading ? "not-allowed" : "pointer",
                background: "none",
                color: T.blue,
                whiteSpace: "nowrap",
              }}
            >
              {roleLoading ? (
                <>
                  <Loader2 size={14} className="spin" /> Cerco...
                </>
              ) : (
                <>
                  <Compass size={14} /> Suggerisci ruoli affini
                </>
              )}
            </button>
          </div>

          {roleError && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, color: T.coral, fontSize: 12.5 }}>
              <AlertCircle size={13} /> {roleError}
            </div>
          )}

          {roleResult && (
            <div style={{ marginTop: 18, display: "grid", gap: 20 }}>
              <div>
                <div style={sectionLabelStyle}>Titoli da cercare</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {(roleResult.suggestedTitles || []).map((t, i) => (
                    <a
                      key={i}
                      href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(t)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: `1px solid ${T.blue}55`,
                        color: T.blue,
                        background: `${T.blue}14`,
                        textDecoration: "none",
                      }}
                    >
                      {t} <ExternalLink size={11} />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div style={sectionLabelStyle}>Posizioni reali trovate</div>
                {roleResult.realOpenings && roleResult.realOpenings.length > 0 ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {roleResult.realOpenings.map((o, i) => (
                      <a
                        key={i}
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `1px solid ${T.hairline}`,
                          background: T.surfaceRaised,
                          textDecoration: "none",
                        }}
                      >
                        <div>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 600, color: T.text }}>
                            {o.title}
                          </div>
                          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                            {o.company}
                            {o.location ? ` · ${o.location}` : ""}
                          </div>
                        </div>
                        <ExternalLink size={14} style={{ color: T.faint, flexShrink: 0 }} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: T.faint, fontSize: 13 }}>
                    Nessuna posizione aperta trovata al momento: prova a cercare i titoli qui sopra su LinkedIn o Indeed.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <button
          onClick={analyze}
          disabled={!canAnalyze}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            padding: "11px 22px",
            borderRadius: 10,
            border: "none",
            cursor: canAnalyze ? "pointer" : "not-allowed",
            background: canAnalyze ? T.amber : T.surfaceRaised,
            color: canAnalyze ? "#1B1408" : T.faint,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="spin" /> Analisi in corso...
            </>
          ) : (
            <>
              <Radar size={16} /> Analizza corrispondenza
            </>
          )}
        </button>
        {error && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, color: T.coral, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {result && (
        <div
          style={{
            border: `1px solid ${T.hairline}`,
            borderRadius: 16,
            background: T.surface,
            padding: 28,
            display: "grid",
            gridTemplateColumns: "168px 1fr",
            gap: 32,
          }}
          className="result-grid"
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <MatchGauge score={result.matchScore} />
          </div>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: T.text }}>
              {result.verdict}
            </div>
            <div>
              <div style={sectionLabelStyle}>Competenze in comune</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(result.matchingSkills || []).map((s, i) => (
                  <Tag key={i} color={T.teal}>
                    <Check size={11} /> {s}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <div style={sectionLabelStyle}>Competenze mancanti</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(result.missingSkills || []).map((s, i) => (
                  <Tag key={i} color={T.coral}>
                    <X size={11} /> {s}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <div style={sectionLabelStyle}>Consigli</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                {(result.suggestions || []).map((s, i) => (
                  <li key={i} style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.5 }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 4, paddingTop: 18, borderTop: `1px solid ${T.hairline}`, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {!saved ? (
                <>
                  <input placeholder="Azienda" value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
                  <input placeholder="Ruolo" value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} />
                  <button onClick={handleSave} style={saveBtnStyle}>
                    <Plus size={14} /> Aggiungi al tracker
                  </button>
                </>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.teal, fontSize: 13 }}>
                  <Check size={15} /> Aggiunta al tracker
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        color,
        background: `${color}14`,
      }}
    >
      {children}
    </span>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.08em",
  color: T.muted,
  marginBottom: 8,
  textTransform: "uppercase",
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.08em",
  color: T.faint,
  textTransform: "uppercase",
  marginBottom: 8,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  height: 200,
  resize: "vertical",
  background: T.surface,
  border: `1px solid ${T.hairline}`,
  borderRadius: 10,
  padding: 14,
  color: T.text,
  fontFamily: "'Inter', sans-serif",
  fontSize: 13.5,
  lineHeight: 1.6,
  outline: "none",
  boxSizing: "border-box",
};

const inputStyle: React.CSSProperties = {
  background: T.surfaceRaised,
  border: `1px solid ${T.hairline}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: T.text,
  fontFamily: "'Inter', sans-serif",
  fontSize: 13,
  outline: "none",
};

const saveBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  padding: "9px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: T.teal,
  color: "#08211E",
};
