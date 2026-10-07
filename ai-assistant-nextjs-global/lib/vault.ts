/**
 * Personal-OS vault search, ported from the Flask `search_vault` tool.
 *
 * The vault lives in `personal-os/vault/` OUTSIDE this project: the repo is
 * public, so the notes are inlined into the worker bundle at build time and
 * never committed. If the folder is absent the tool degrades to a notice.
 */
const PREFIX = "../../personal-os/vault/";

const notes = import.meta.glob("../../personal-os/vault/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function relativePath(key: string): string {
  return key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key;
}

/** Same tokenisation as the Python tool: words of 3+ chars, lowercased. */
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^0-9a-zà-ÿ]+/u)
    .filter((t) => t.length >= 3);
}

export function searchVault(query: string): string {
  const entries = Object.entries(notes);
  if (entries.length === 0) {
    return "Notes personnelles indisponibles dans cette installation.";
  }

  const terms = tokenize(query);
  if (terms.length === 0) {
    return "Requête trop vague. Reformule avec un nom de projet, de personne ou de sujet.";
  }

  const hits: { score: number; rel: string; snippets: string[] }[] = [];

  for (const [key, text] of entries) {
    const low = text.toLowerCase();
    const score = terms.reduce((sum, t) => sum + low.split(t).length - 1, 0);
    if (score === 0) continue;

    const snippets: string[] = [];
    for (const para of text.split("\n\n")) {
      const trimmed = para.trim();
      const paraLow = trimmed.toLowerCase();
      if (trimmed.length > 20 && terms.some((t) => paraLow.includes(t))) {
        snippets.push(trimmed.slice(0, 400));
        if (snippets.length >= 2) break;
      }
    }
    hits.push({ score, rel: relativePath(key), snippets });
  }

  if (hits.length === 0) {
    const available = entries
      .map(([key]) => relativePath(key))
      .sort()
      .join(", ");
    return `Aucune note pour « ${query} ». Notes disponibles : ${available}`;
  }

  hits.sort((a, b) => b.score - a.score);
  return hits
    .slice(0, 3)
    .map((h) => `[${h.rel}]\n${h.snippets.join("\n")}`)
    .join("\n\n");
}
