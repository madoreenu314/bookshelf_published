export type Book = {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  tags: string[];
  shelf: "jp" | "foreign";
  rating: number;
  finishedOn: string;
  article?: string;
};
