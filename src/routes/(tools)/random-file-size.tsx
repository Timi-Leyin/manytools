import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(tools)/random-file-size')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(tools)/random-file-size"!</div>
}
