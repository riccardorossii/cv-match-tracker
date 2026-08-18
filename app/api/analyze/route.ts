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

  const { cvBase64, jobDescription } = await request.json();

  if (!cvBase64 || !jobDescription || jobDescription.trim().length < 30) {
    return NextResponse.json(
      { error: "CV e job description sono obbligatori." },
      { status: 400 }
    );
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
        system:
          'Sei un esperto di recruiting e career coaching. Ricevi il CV di una persona in formato PDF e il testo di una job description. Rispondi SOLO con un oggetto JSON valido, senza testo introduttivo, senza markdown, senza backtick. Schema esatto: {"matchScore": number (0-100), "verdict": string breve (max 8 parole, in italiano), "matchingSkills": string[] (max 8), "missingSkills": string[] (max 8), "suggestions": string[] (max 4, consigli concreti in italiano)}.',
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
                text: `JOB DESCRIPTION:\n${jobDescription}\n\nAnalizza la corrispondenza tra il CV allegato in PDF e questa job description.`,
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
      { error: "Errore imprevisto durante l'analisi." },
      { status: 500 }
    );
  }
}
