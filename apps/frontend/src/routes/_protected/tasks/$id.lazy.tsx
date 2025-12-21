import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_protected/tasks/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/tasks/$id"!</div>
}
