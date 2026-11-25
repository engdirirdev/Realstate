// ================================================================
// MODULE     : Executive Team Configuration & Helpers
// DESCRIPTION: Shared schema, defaults, and parser for Executive Team
//              stored in SystemSetting ("executive_team")
// ================================================================

export interface ExecutiveTeamMember {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  bio?: string | null;
}

export const EXECUTIVE_TEAM_SETTING_KEY = "executive_team";

export const DEFAULT_EXECUTIVE_TEAM: ExecutiveTeamMember[] = [
  { id: "exec-1", name: "Mohamed Ali Hassan", role: "CEO & Co-Founder", image: null, bio: "" },
  { id: "exec-2", name: "Fadumo Warsame", role: "Chief AI Officer", image: null, bio: "" },
  { id: "exec-3", name: "Abdi Noor", role: "Head of Properties", image: null, bio: "" },
  { id: "exec-4", name: "Ifrah Said", role: "Lead Designer", image: null, bio: "" },
];

export function parseExecutiveTeam(raw?: string | null): ExecutiveTeamMember[] {
  if (raw === undefined || raw === null) {
    return DEFAULT_EXECUTIVE_TEAM;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((m) => m && typeof m.name === "string" && m.name.trim().length > 0)
        .map((m, idx) => ({
          id: typeof m.id === "string" && m.id ? m.id : `exec-${idx + 1}`,
          name: String(m.name).trim(),
          role: typeof m.role === "string" ? m.role.trim() : "",
          image: typeof m.image === "string" && m.image.trim() ? m.image.trim() : null,
          bio: typeof m.bio === "string" ? m.bio.trim() : "",
        }));
    }
  } catch {
    // Fall back to default team if JSON is malformed
  }
  return DEFAULT_EXECUTIVE_TEAM;
}

