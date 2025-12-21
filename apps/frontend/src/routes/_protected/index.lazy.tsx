import { createLazyFileRoute } from '@tanstack/react-router';

const DashboardComponent = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        <div
          className={`
            grid grid-cols-1 gap-6
            md:grid-cols-2
            lg:grid-cols-3
          `}
        >
          <div className="rounded-lg border p-6">
            <h2 className="mb-2 text-xl font-semibold">Welcome to CodeGraph</h2>
            <p className="text-gray-600">Your AI-powered development assistant.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createLazyFileRoute('/_protected/')({
  component: DashboardComponent,
});
