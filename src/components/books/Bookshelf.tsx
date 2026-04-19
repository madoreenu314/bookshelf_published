"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/types/book";
import { getAllTags } from "@/lib/books";
import { BookCard } from "@/components/books/BookCard";
import { Filters } from "@/components/books/Filters";

type Props = {
  books: Book[];
};

export function Bookshelf({ books }: Props) {
  const tags = useMemo(() => getAllTags(books), [books]);

  const [shelf, setShelf] = useState<"all" | Book["shelf"]>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const shelfOk = shelf === "all" ? true : book.shelf === shelf;
      const tagsOk =
        selectedTags.length === 0
          ? true
          : selectedTags.every((t) => book.tags.includes(t));
      return shelfOk && tagsOk;
    });
  }, [books, selectedTags, shelf]);

  return (
    <section aria-label="Books">
      <Filters
        tags={tags}
        shelf={shelf}
        selectedTags={selectedTags}
        onChangeShelf={setShelf}
        onToggleTag={(tag) =>
          setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
          )
        }
        onReset={() => {
          setShelf("all");
          setSelectedTags([]);
        }}
        count={filtered.length}
        total={books.length}
      />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
