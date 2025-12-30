import { createFileRoute, Link } from '@tanstack/react-router';
import { HomeIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export const Route = createFileRoute('/$404')({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-teal/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-brand-cyan/10 blur-3xl" />

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-lg text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[12rem] leading-none font-black tracking-tighter text-brand-teal/10">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gradient-teal flex h-32 w-32 items-center justify-center rounded-full shadow-elevated">
              <MagnifyingGlassIcon className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-text-primary">Page Not Found</h1>
        <p className="mb-8 text-lg text-text-secondary">
          Oops! The page you&apos;re looking for seems to have wandered off.
          <br />
          It might have been moved, deleted, or never existed.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="bg-gradient-teal inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-button-hover transition-all hover:scale-105"
          >
            <HomeIcon className="h-5 w-5" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-border-primary bg-surface px-6 py-3 font-semibold text-text-primary transition-all hover:border-brand-teal/50 hover:shadow-card-hover"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Go Back
          </button>
        </div>

        {/* Help text */}
        <p className="mt-12 text-sm text-text-muted">
          Need help?{' '}
          <a href="mailto:support@codegraph.io" className="text-brand-teal hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
