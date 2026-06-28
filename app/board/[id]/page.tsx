export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-1 items-center justify-center text-gray-400">
      <p>Board {id}</p>
    </div>
  );
}
