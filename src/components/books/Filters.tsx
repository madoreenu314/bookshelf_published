"use client";

type Props = {
  tags: string[];
  shelf: "all" | "jp" | "foreign";
  selectedTags: string[];
  onChangeShelf: (next: "all" | "jp" | "foreign") => void;
  onToggleTag: (tag: string) => void;
  onReset: () => void;
  count: number;
  total: number;
};

export function Filters({
  tags,
  shelf,
  selectedTags,
  onChangeShelf,
  onToggleTag,
  onReset,
  count,
  total,
}: Props) {
  return (
    <div className="rounded-3xl border border-black/10 bg-[rgb(var(--card))]/70 p-4 shadow-sm backdrop-blur dark:border-white/10 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold tracking-tight">
          Books{" "}
          <span className="ml-2 text-xs font-medium text-[rgb(var(--muted))]">
            {count}/{total}
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="focus-ring rounded-full border border-black/10 bg-transparent px-3 py-1.5 text-xs font-medium text-[rgb(var(--muted))] transition hover:text-[rgb(var(--fg))] dark:border-white/10"
        >
          Reset
        </button>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-[rgb(var(--muted))]">
          Shelf
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill active={shelf === "all"} onClick={() => onChangeShelf("all")}>
            All
          </Pill>
          <Pill active={shelf === "jp"} onClick={() => onChangeShelf("jp")}>
            和書
          </Pill>
          <Pill
            active={shelf === "foreign"}
            onClick={() => onChangeShelf("foreign")}
          >
            洋書
          </Pill>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-medium text-[rgb(var(--muted))]">
          Tags
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagChip
              key={tag}
              active={selectedTags.includes(tag)}
              onClick={() => onToggleTag(tag)}
            >
              {tag}
            </TagChip>
          ))}
        </div>
      </div>
    </div>
  );
}

function TagChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "focus-ring rounded-full px-3 py-1.5 text-xs font-medium transition",
        "border",
        active
          ? "border-black/10 bg-[rgb(var(--accent))]/10 text-[rgb(var(--fg))] dark:border-white/10"
          : "border-black/10 bg-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] dark:border-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "focus-ring rounded-full px-3 py-1.5 text-xs font-medium transition",
        "border",
        active
          ? "border-black/10 bg-black/5 text-[rgb(var(--fg))] dark:border-white/10 dark:bg-white/10"
          : "border-black/10 bg-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] dark:border-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
