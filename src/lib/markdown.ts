import { marked } from "marked";

const renderer = new marked.Renderer();
renderer.html = () => "";

marked.setOptions({
  gfm: true,
  breaks: false,
});
marked.use({ renderer });

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string;
}

