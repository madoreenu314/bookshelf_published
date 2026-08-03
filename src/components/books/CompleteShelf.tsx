"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Book } from "@/types/book";
import { formatFinishedOn } from "@/lib/date";
import {
  SHELF_SCENE_VERSION,
  ShelfScene,
} from "@/components/books/ShelfScene";

type Props = {
  books: Book[];
};

export function CompleteShelf({ books }: Props) {
  const shelfBooks = useMemo(() => [...books].reverse(), [books]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ShelfScene | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || shelfBooks.length === 0) return;
    setReady(false);
    setSelectedIndex(null);

    const scene = new ShelfScene(canvasRef.current, shelfBooks, {
      onSelectionChange: setSelectedIndex,
      onReady: () => setReady(true),
    });
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [shelfBooks, SHELF_SCENE_VERSION]);

  if (shelfBooks.length === 0) return null;

  const selectedBook = selectedIndex === null ? null : shelfBooks[selectedIndex];
  const isFocused = selectedBook !== null;

  return (
    <section
      className={`complete-library ${ready ? "is-ready" : ""} ${
        isFocused ? "is-focused" : "is-browsing"
      }`}
      aria-label="Interactive complete shelf"
    >
      <canvas
        ref={canvasRef}
        className="complete-library__canvas"
        tabIndex={0}
        role="application"
        aria-label={`${shelfBooks.length}冊の3D本棚。本にマウスを重ねると少し手前へ動き、クリックすると詳細を表示します。`}
      />

      <header className="complete-library__header">
        <div className="complete-library__wordmark">
          <span>MADOREENU</span>
          <i />
          <span>READING ARCHIVE</span>
        </div>
      </header>

      <aside className="complete-library__details" aria-hidden={!isFocused}>
        {selectedBook ? (
          <div className="complete-library__details-inner">
            <button
              type="button"
              className="complete-library__back"
              onClick={() => sceneRef.current?.returnToShelf()}
            >
              <span aria-hidden="true">←</span>
              <span>Return to shelf</span>
            </button>
            <p className="complete-library__details-position">
              {String(selectedIndex! + 1).padStart(2, "0")} / {String(shelfBooks.length).padStart(2, "0")}
            </p>
            <div className="complete-library__details-copy">
              <p className="complete-library__eyebrow">
                {selectedBook.shelf === "jp" ? "JAPANESE EDITION" : "FOREIGN EDITION"}
              </p>
              <h3>{selectedBook.title}</h3>
              <p className="complete-library__details-author">{selectedBook.author}</p>
              <dl>
                <div>
                  <dt>Finished</dt>
                  <dd>{formatFinishedOn(selectedBook.finishedOn)}</dd>
                </div>
                <div>
                  <dt>Rating</dt>
                  <dd>{selectedBook.rating} / 5</dd>
                </div>
                <div>
                  <dt>Pages</dt>
                  <dd>{selectedBook.pageCount}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>
                    {selectedBook.heightMm} × {selectedBook.widthMm} × {selectedBook.thicknessMm} mm
                  </dd>
                </div>
              </dl>
              <div className="complete-library__tags">
                {selectedBook.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {selectedBook.article ? (
                <Link href={`/book/${selectedBook.id}`}>
                  <span>Read note</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>

      <div className="complete-library__loading" aria-hidden={ready}>
        <div><span /><span /><span /></div>
        <p>ASSEMBLING {shelfBooks.length} VOLUMES</p>
      </div>
    </section>
  );
}
