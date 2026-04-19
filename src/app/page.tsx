import { Bookshelf } from "@/components/books/Bookshelf";
import { getBooks } from "@/lib/books";

export default function Home() {
  const books = getBooks();

  return (
    <div className="min-h-screen shelf-bg">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        <main className="mt-10">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            madoreenu&apos;s bookshelf
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[rgb(var(--muted))] sm:text-base">
            <a
              href="https://madoreenu314.github.io/profile"
              className="focus-ring font-medium text-[rgb(var(--fg))] underline decoration-black/20 underline-offset-4 transition hover:decoration-black/40 dark:decoration-white/20 dark:hover:decoration-white/40"
            >
              @madoreenu314
            </a>{" "}
            の本棚です。読了日順に並べています
          </p>

          <div className="mt-10">
            <Bookshelf books={books} />
          </div>
        </main>
      </div>
    </div>
  );
}
