"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  StickyNote,
  Trash2,
} from "lucide-react";
import { scoreColor } from "./MatchGauge";
import { STATUS_META, type Application, type Status } from "@/lib/types";

const T = {
  surface: "#1B2540",
  hairline: "#2E3A57",
  text: "#EDEFF5",
  muted: "#8D97B0",
  faint: "#5C6786",
};

export default function TrackerView({
  apps,
  onUpdate,
  onDelete,
}: {
  apps: Application[];
  onUpdate: (id: string, patch: Partial<Application>) => void;
  onDelete: (id: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const columns = (Object.keys(STATUS_META) as Status[]).sort(
    (a, b) => STATUS_META[a].order - STATUS_META[b].order
  );

  if (apps.length === 0) {
    return (
      <div
        style={{
          border: `1px dashed ${T.hairline}`,
          borderRadius: 16,
          padding: "60px 24px",
          textAlign: "center",
          color: T.faint,
        }}
      >
        <Briefcase size={28} style={{ marginBottom: 12, opacity: 0.5 }} />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, color: T.muted }}>
          Il tracker è vuoto
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Analizza un annuncio e aggiungilo al tracker per iniziare.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 16 }}
      className="tracker-grid"
    >
      {columns.map((statusKey) => {
        const meta = STATUS_META[statusKey];
        const items = apps.filter((a) => a.status === statusKey);
        return (
          <div key={statusKey}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                paddingBottom: 10,
                borderBottom: `2px solid ${meta.color}`,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color }} />
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11.5,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: T.text,
                }}
              >
                {meta.label}
              </span>
              <span style={{ marginLeft: "auto", color: T.faint, fontSize: 12 }}>{items.length}</span>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {items.map((app) => (
                <div key={app.id} style={{ background: T.surface, border: `1px solid ${T.hairline}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: T.text }}>
                      {app.role}
                    </div>
                    <button
                      onClick={() => onDelete(app.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: T.faint, padding: 2 }}
                      title="Elimina"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.muted, fontSize: 12.5, marginTop: 3 }}>
                    <Building2 size={11} /> {app.company}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, color: T.faint, fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={11} /> {new Date(app.created_at).toLocaleDateString("it-IT")}
                    </span>
                    {typeof app.match_score === "number" && (
                      <span style={{ color: scoreColor(app.match_score) }}>{app.match_score}% match</span>
                    )}
                  </div>

                  {editingNotes === app.id ? (
                    <textarea
                      autoFocus
                      value={app.notes}
                      onChange={(e) => onUpdate(app.id, { notes: e.target.value })}
                      onBlur={() => setEditingNotes(null)}
                      style={{
                        width: "100%",
                        height: 60,
                        marginTop: 10,
                        resize: "vertical",
                        background: T.surface,
                        border: `1px solid ${T.hairline}`,
                        borderRadius: 8,
                        padding: 8,
                        color: T.text,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 12.5,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingNotes(app.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 10,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: app.notes ? T.muted : T.faint,
                        fontSize: 12,
                        padding: 0,
                        textAlign: "left",
                      }}
                    >
                      <StickyNote size={11} />
                      {app.notes ? app.notes : "Aggiungi nota"}
                    </button>
                  )}

                  <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                    {columns
                      .filter((s) => s !== statusKey)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() => onUpdate(app.id, { status: s })}
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10.5,
                            padding: "4px 8px",
                            borderRadius: 999,
                            border: `1px solid ${STATUS_META[s].color}55`,
                            color: STATUS_META[s].color,
                            background: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <ChevronRight size={10} /> {STATUS_META[s].label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
