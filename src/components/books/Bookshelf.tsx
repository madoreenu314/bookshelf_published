"use client";

import { useEffect, useMemo, useState } from "react";
import type { Book } from "@/types/book";
import { getAllTags } from "@/lib/books";
import { BookCard } from "@/components/books/BookCard";
import { CompleteShelf } from "@/components/books/CompleteShelf";
import { Filters } from "@/components/books/Filters";

type Props = {
  books: Book[];
};

export function Bookshelf({ books }: Props) {
  const tags = useMemo(() => getAllTags(books), [books]);

  const [viewMode, setViewMode] = useState<"list" | "3d">("3d");
  const [shelf, setShelf] = useState<"all" | Book["shelf"]>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (viewMode !== "3d") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewMode]);

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

  if (viewMode === "3d") {
    return (
      <section
        className="bookshelf-3d-mode fixed inset-0 z-50"
        aria-label="3D bookshelf"
      >
        <ViewSwitcher viewMode={viewMode} onChange={setViewMode} is3d />
        <CompleteShelf books={books} />
      </section>
    );
  }

  return (
    <section aria-label="Books">
      <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

      <div>
        <Filters
          tags={tags}
          shelf={shelf}
          selectedTags={selectedTags}
          onChangeShelf={setShelf}
          onToggleTag={(tag) =>
            setSelectedTags((prev) =>
              prev.includes(tag)
                ? prev.filter((t) => t !== tag)
                : [...prev, tag],
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
      </div>
    </section>
  );
}

function ViewSwitcher({
  viewMode,
  onChange,
  is3d = false,
}: {
  viewMode: "list" | "3d";
  onChange: (mode: "list" | "3d") => void;
  is3d?: boolean;
}) {
  return (
    <div
      className={[
        "fixed right-5 top-5 z-[60] inline-flex rounded-full border border-black/10 bg-[rgb(var(--card))]/85 p-1 shadow-sm backdrop-blur sm:right-8",
        is3d
          ? "border-black/15 bg-[#f5efe4]/90 text-[#25211d] sm:top-5"
          : "bg-[rgb(var(--card))]/85 sm:top-5",
      ].join(" ")}
      role="group"
      aria-label="表示方法"
    >
      <ViewButton
        active={viewMode === "list"}
        onClick={() => onChange("list")}
        light={is3d}
      >
        一覧
      </ViewButton>
      <ViewButton
        active={viewMode === "3d"}
        onClick={() => onChange("3d")}
        light={is3d}
      >
        3D Shelf
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  light = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  light?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "focus-ring rounded-full px-4 py-2 text-xs font-semibold transition",
        active && light
          ? "bg-[#25211d] text-[#f5efe4] shadow-sm"
          : active
          ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] shadow-sm"
          : light
            ? "text-[#655d54] hover:text-[#25211d]"
          : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
