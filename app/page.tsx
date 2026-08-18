"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Briefcase, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AnalyzeView from "@/components/AnalyzeView";
import TrackerView from "@/components/TrackerView";
import type { Application, Status } from "@/lib/types";

const T = {
  bg: "#141B2E",
  surfaceRaised: "#212C4B",
  hairline: "#2E3A57",
  text: "#EDEFF5",
  faint: "#5C6786",
  amber: "#F2A93B",
};

export default function DashboardPage() {
  const [tab, setTab] = useState<"analyze" | "tracker">("analyze");
  const [apps, setApps] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const supabaseRef = useRef(createClient());
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseRef.current;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setApps(data as Application[]);
      setLoaded(true);
    })();
  }, []);

  async function addApp(app: {
    company: string;
    role: string;
    status: Status;
    match_score: number;
  }) {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("applications")
      .insert({ ...app, user_id: user.id, notes: "" })
      .select()
      .single();

    if (!error && data) {
      setApps((prev) => [data as Application, ...prev]);
      setTab("tracker");
    }
  }

  async function updateApp(id: string, patch: Partial<Application>) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    const supabase = supabaseRef.current;
    await supabase.from("applications").update(patch).eq("id", id);
  }

  async function deleteApp(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id));
    const supabase = supabaseRef.current;
    await supabase.from("applications").delete().eq("id", id);
  }

  async function handleLogout() {
    const supabase = supabaseRef.current;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, padding: "36px 28px 60px" }}>
      <style>{`
        @media (max-width: 760px) {
          .analyze-grid { grid-template-columns: 1fr !important; }
          .result-grid { grid-template-columns: 1fr !important; }
          .tracker-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 34 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: T.surfaceRaised,
              border: `1px solid ${T.hairline}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.amber,
            }}
          >
            <Radar size={20} />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Match & Tracker
            </div>
            <div style={{ fontSize: 12, color: T.faint }}>Analisi CV / annuncio e monitoraggio candidature</div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            {userEmail && (
              <span style={{ fontSize: 12, color: T.faint, fontFamily: "'IBM Plex Mono', monospace" }}>
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: `1px solid ${T.hairline}`,
                borderRadius: 8,
                padding: "7px 12px",
                color: T.faint,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              <LogOut size={13} /> Esci
            </button>
          </div>
        </header>

        <nav style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.hairline}` }}>
          {[
            { key: "analyze" as const, label: "Analizza", icon: Radar },
            { key: "tracker" as const, label: `Tracker${apps.length ? ` (${apps.length})` : ""}`, icon: Briefcase },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13.5,
                fontWeight: 600,
                padding: "10px 16px",
                background: "none",
                border: "none",
                borderBottom: tab === key ? `2px solid ${T.amber}` : "2px solid transparent",
                marginBottom: -1,
                color: tab === key ? T.text : T.faint,
                cursor: "pointer",
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>

        {!loaded ? (
          <div style={{ color: T.faint, fontSize: 13 }}>Caricamento...</div>
        ) : tab === "analyze" ? (
          <AnalyzeView onSave={addApp} />
        ) : (
          <TrackerView apps={apps} onUpdate={updateApp} onDelete={deleteApp} />
        )}
      </div>
    </div>
  );
}
