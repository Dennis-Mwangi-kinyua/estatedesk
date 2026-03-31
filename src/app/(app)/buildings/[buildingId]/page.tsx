type PageProps = {
  params: Promise<{ buildingId: string }>;
};

export default async function BuildingPage({ params }: PageProps) {
  const { buildingId } = await params;

  return (
    <div>
      <h1>Building</h1>
      <p>ID: {buildingId}</p>
    </div>
  );
}
