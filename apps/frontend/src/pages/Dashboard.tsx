export function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium">Total Tasks</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium">Active Tasks</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium">Completed Tasks</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium">Agent Runs</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
