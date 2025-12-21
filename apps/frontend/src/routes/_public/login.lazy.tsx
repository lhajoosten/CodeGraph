import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_public/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/login"!</div>
}
