import { createFileRoute } from '@tanstack/react-router'
import KanbanBoard from '../components/KanbanBoard'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="min-h-screen relative z-10">
      <KanbanBoard />
    </main>
  )
}
