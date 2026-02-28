import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Trash2, Users } from 'lucide-react'
import PlayerCard from './PlayerCard'
import type { Player, Team } from '../lib/supabase'

interface TeamColumnProps {
  team: Team
  title: string
  players: Player[]
  accentColor: string
  onMoveToTeam: (playerId: number, team: Team) => void
  onDelete: (playerId: number) => void
  onClearTeam: (team: Team) => void
}

export default function TeamColumn({
  team,
  title,
  players,
  accentColor,
  onMoveToTeam,
  onDelete,
  onClearTeam,
}: TeamColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: team })

  return (
    <div
      className={`flex flex-col rounded-2xl border transition-colors ${
        isOver
          ? 'border-neutral-500/50 bg-neutral-800/30'
          : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: accentColor }} />
          <h2 className="text-sm font-bold" style={{ color: accentColor }}>
            {title}
          </h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-text-muted">
            {players.length} oyuncu
          </span>
        </div>
        {players.length > 0 && (
          <button
            onClick={() => onClearTeam(team)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-danger transition hover:bg-red-950/40"
            title={`Tüm ${title} oyuncularını sil`}
          >
            <Trash2 size={12} />
            Temizle
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 p-3 min-h-[120px]"
      >
        <SortableContext
          items={players.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onMoveToTeam={onMoveToTeam}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {players.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border py-8">
            <p className="text-xs text-text-muted">
              Oyuncu sürükleyin veya gönderin
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
