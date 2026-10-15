export type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    deleteError?: string;
    archiveError?: string;
  }>;
};
