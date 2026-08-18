import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractJson(content: any[]): any {
  const textBlocks = (content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text);
  const combined = textBlocks.join("\n");
  const clean = combined.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Impossibile interpretare la risposta del modello.");
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { cvBase64 } = await request.json();

  if (!cvBase64) {
    return NextResponse.json({ error: "CV obbligatorio." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurata sul server." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system:
          'Sei un consulente di carriera. Analizza il profilo professionale nel CV PDF allegato (competenze, esperienza, settore, seniority) e suggerisci ruoli lavorativi affini da cercare. Se puoi, usa la ricerca web per trovare 2-4 posizioni realmente aperte in questo momento compatibili col profilo. Rispondi SOLO con un oggetto JSON valido, senza testo introduttivo, senza markdown, senza backtick, dopo aver eventualmente usato gli strumenti di ricerca. Schema esatto: {"suggestedTitles": string[] (5-8 nomi di ruolo affini, in italiano, brevi), "realOpenings": [{"title": string, "company": string, "location": string, "url": string}] (0-4 posizioni reali trovate; array vuoto se non trovi nulla di affidabile)}.',
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: cvBase64,
                },
              },
              {
                type: "text",
                text: "Suggerisci ruoli professionali affini a questo profilo e, se trovi qualcosa di affidabile con la ricerca web, alcune posizioni aperte reali.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json(
        { error: "Errore nella chiamata al modello." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const parsed = extractJson(data.content);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Errore imprevisto durante la ricerca." },
      { status: 500 }
    );
  }
}
