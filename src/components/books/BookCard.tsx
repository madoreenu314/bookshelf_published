import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/types/book";
import { formatFinishedOn } from "@/lib/date";

type Props = {
  book: Book;
};

export function BookCard({ book }: Props) {
  const inner = (
    <>
      <div className="relative overflow-hidden rounded-lg ring-1 ring-black/10 dark:ring-white/10">
        <Image
          src={book.coverImage}
          alt={book.title}
          width={900}
          height={1200}
          className="h-auto w-full origin-center transition duration-500 ease-out-soft group-hover:scale-[1.03]"
          priority={false}
        />
        {book.article ? (
          <div className="pointer-events-none absolute right-2 top-2 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
            Note
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100 dark:from-black/30" />
      </div>

      <div className="mt-2.5">
        <div className="mt-2.5">
          <div className="flex items-center gap-2">
            <Stars rating={book.rating} />
            <span className="text-[11px] text-[rgb(var(--muted))]">
              {formatFinishedOn(book.finishedOn)}
            </span>
          </div>
          <div className="mt-2 hidden w-full flex-wrap gap-1.5 md:flex">
            {book.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[10px] font-medium text-[rgb(var(--muted))] dark:border-white/10 dark:bg-white/5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (!book.article) {
    return (
      <article className="group rounded-2xl border border-black/10 bg-[rgb(var(--card))]/80 p-3 shadow-sm backdrop-blur dark:border-white/10">
        {inner}
      </article>
    );
  }

  return (
    <Link
      href={`/book/${book.id}`}
      className="focus-ring group block rounded-2xl border border-black/10 bg-[rgb(var(--card))]/80 p-3 shadow-sm backdrop-blur transition duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-soft dark:border-white/10 dark:hover:shadow-softDark"
      aria-label={book.title}
    >
      {inner}
    </Link>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  const stars = Array.from({ length: 5 }, (_, i) => i < full);
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating}/5`}>
      {stars.map((on, i) => (
        <span
          key={i}
          className={[
            "inline-block size-1.5 rounded-full",
            on ? "bg-[rgb(var(--accent))]" : "bg-black/10 dark:bg-white/10",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
