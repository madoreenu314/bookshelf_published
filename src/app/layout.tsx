import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookshelf",
  description: "個人の本棚をそのままWebにした、表紙が主役のブックギャラリー。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
