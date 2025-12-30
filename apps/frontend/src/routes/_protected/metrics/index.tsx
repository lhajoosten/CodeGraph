import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/metrics/')({
  component: () => <div>Metrics Dashboard</div>,
});
