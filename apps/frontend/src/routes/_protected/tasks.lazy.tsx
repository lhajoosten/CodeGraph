import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_protected/tasks')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/tasks"!</div>
}
