import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/$404')({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, var(--color-background) 0%, var(--color-background-elevated) 100%)`,
      }}
      className="flex min-h-screen items-center justify-center px-4 py-12"
    >
      <div className="max-w-md text-center">
        <div className="mb-6">
          <h1 style={{ color: 'var(--color-brand-cyan)' }} className="text-6xl font-bold">
            404
          </h1>
          <p style={{ color: 'var(--color-text-primary)' }} className="mt-2 text-2xl font-semibold">
            Page Not Found
          </p>
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }} className="mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          style={{
            backgroundColor: 'var(--color-brand-cyan)',
            color: 'var(--color-background)',
          }}
          className="inline-block rounded-md px-6 py-3 font-medium transition hover:opacity-90"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
