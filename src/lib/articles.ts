import fs from "node:fs";
import path from "node:path";

export function readArticleMarkdown(articlePath: string): string | null {
  const normalized = path.normalize(articlePath);
  const fullPath = path.join(process.cwd(), normalized);

  if (!fullPath.startsWith(process.cwd())) return null;
  if (!fs.existsSync(fullPath)) return null;

  return fs.readFileSync(fullPath, "utf8");
}

