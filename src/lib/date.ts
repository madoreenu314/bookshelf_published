export function formatFinishedOn(input: string): string {
  const isoLike = input.trim();

  // Accept: YYYY-MM-DD or YYYY/MM/DD (store ISO recommended)
  const m = isoLike.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!m) return input;

  const y = m[1];
  const mm = m[2].padStart(2, "0");
  const dd = m[3].padStart(2, "0");
  return `${y}/${mm}/${dd}`;
}

