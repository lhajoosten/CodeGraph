import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/unauthorized')({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div
      className={`
        flex min-h-screen items-center justify-center bg-gradient-to-br
        from-gray-50 to-gray-100
      `}
    >
      <div className="max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-600">403</h1>
          <p className="mt-2 text-2xl font-semibold text-gray-800">Unauthorized</p>
        </div>
        <p className="mb-8 text-gray-600">You do not have permission to access this resource.</p>
        <Link
          to="/"
          className={`
            inline-block rounded-md bg-blue-600 px-6 py-3 text-white
            hover:bg-blue-700
          `}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
