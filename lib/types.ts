export type Status = "inviata" | "colloquio" | "offerta" | "rifiutata";

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: Status;
  match_score: number | null;
  notes: string;
  created_at: string;
}

export const STATUS_META: Record<
  Status,
  { label: string; color: string; order: number }
> = {
  inviata: { label: "Candidatura inviata", color: "#5B8DEF", order: 0 },
  colloquio: { label: "Colloquio", color: "#3FB8AF", order: 1 },
  offerta: { label: "Offerta", color: "#F2A93B", order: 2 },
  rifiutata: { label: "Rifiutata", color: "#E5573F", order: 3 },
};
