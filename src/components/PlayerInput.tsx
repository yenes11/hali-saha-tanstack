import { useState } from 'react'
import { UserPlus } from 'lucide-react'

interface PlayerInputProps {
  onAdd: (name: string) => void
  disabled?: boolean
}

export default function PlayerInput({ onAdd, disabled }: PlayerInputProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Oyuncu adı..."
        disabled={disabled}
        className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !name.trim()}
        className="flex items-center gap-2 rounded-xl bg-neutral-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <UserPlus size={16} />
        Ekle
      </button>
    </form>
  )
}
