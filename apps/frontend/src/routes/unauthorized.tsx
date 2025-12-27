import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/unauthorized')({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, var(--color-bg-primary-lum) 0%, var(--color-bg-elevated-lum) 100%)`,
      }}
      className="flex min-h-screen items-center justify-center px-4 py-12"
    >
      <div className="max-w-md text-center">
        <div className="mb-6">
          <h1 style={{ color: 'var(--color-error)' }} className="text-6xl font-bold">
            403
          </h1>
          <p
            style={{ color: 'var(--color-text-primary-lum)' }}
            className="mt-2 text-2xl font-semibold"
          >
            Unauthorized
          </p>
        </div>
        <p style={{ color: 'var(--color-text-secondary-lum)' }} className="mb-8">
          You do not have permission to access this resource.
        </p>
        <Link
          to="/"
          style={{
            backgroundColor: 'var(--color-brand-cyan)',
            color: 'var(--color-bg-primary-lum)',
          }}
          className="inline-block rounded-md px-6 py-3 font-medium transition hover:opacity-90"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
