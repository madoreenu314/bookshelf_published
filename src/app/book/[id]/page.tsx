import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookById, getBooks } from "@/lib/books";
import { readArticleMarkdown } from "@/lib/articles";
import { markdownToHtml } from "@/lib/markdown";
import { formatFinishedOn } from "@/lib/date";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getBooks().map((b) => ({ id: b.id }));
}

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) notFound();

  const md = book.article ? readArticleMarkdown(book.article) : null;
  const html = md ? markdownToHtml(md) : null;

  return (
    <div className="min-h-screen shelf-bg">
      <div className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-black/10 bg-[rgb(var(--card))]/70 px-3 py-2 text-xs font-medium text-[rgb(var(--fg))] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:hover:shadow-softDark"
          >
            <span aria-hidden>←</span>
            Back
          </Link>
          <div className="text-xs font-medium text-[rgb(var(--muted))]">
            {book.shelf === "jp" ? "和書" : "洋書"}
          </div>
        </header>

        <div className="mt-10 grid gap-10 md:grid-cols-[320px_1fr]">
          <div>
            <div className="mx-auto w-full max-w-[280px] sm:max-w-[340px] md:mx-0 md:max-w-none">
              <div className="rounded-3xl border border-black/10 bg-[rgb(var(--card))]/80 p-3 shadow-sm backdrop-blur dark:border-white/10">
                <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    width={900}
                    height={1200}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-[280px] flex-wrap gap-2 sm:max-w-[340px] md:mx-0 md:max-w-none">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[11px] font-medium text-[rgb(var(--muted))] dark:border-white/10 dark:bg-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <main>
            <div className="rounded-3xl border border-black/10 bg-[rgb(var(--card))]/70 p-5 shadow-sm backdrop-blur dark:border-white/10 sm:p-6">
              <div className="text-xs font-medium text-[rgb(var(--muted))]">
                {book.author} · {formatFinishedOn(book.finishedOn)}
              </div>
              <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {book.title}
              </h1>
            </div>

            <section className="mt-6 rounded-3xl border border-black/10 bg-[rgb(var(--card))]/70 p-5 shadow-sm backdrop-blur dark:border-white/10 sm:p-6">
              {html ? (
                <div
                  className="mdx"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="text-sm text-[rgb(var(--muted))]">
                  この記事はまだありません。
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
