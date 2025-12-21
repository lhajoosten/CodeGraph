import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_public/login')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello &quot;/_public/login&quot;!</div>;
}
