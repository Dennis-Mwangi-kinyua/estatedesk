import type { getCaretakerSearchResults } from "./queries";

export type SearchParams = {
  q?: string;
};

export type SearchPageProps = {
  searchParams?: Promise<SearchParams>;
};

export type CaretakerSearchPageData = Awaited<
  ReturnType<typeof getCaretakerSearchResults>
>;

export type SearchResultRow = {
  id: string;
  primary: string;
  secondary: string;
  status: string;
  href: string;
  date: Date;
};