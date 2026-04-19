import raw from "../../books.json";
import type { Book } from "@/types/book";

function normalizeBook(input: Book): Book {
  return {
    ...input,
    rating: Math.max(0, Math.min(5, input.rating)),
  };
}

function toEpochDay(dateLike: string): number {
  const normalized = dateLike.trim().replaceAll("/", "-");
  const t = Date.parse(normalized);
  return Number.isFinite(t) ? t : -Infinity;
}

export function getBooks(): Book[] {
  return (raw as Book[])
    .map(normalizeBook)
    .sort((a, b) => toEpochDay(b.finishedOn) - toEpochDay(a.finishedOn));
}

export function getBookById(id: string): Book | null {
  const books = getBooks();
  return books.find((b) => b.id === id) ?? null;
}

export function getAllTags(books: Book[]): string[] {
  const tags = new Set<string>();
  for (const book of books) for (const tag of book.tags) tags.add(tag);
  return [...tags].sort((a, b) => a.localeCompare(b, "ja"));
}
