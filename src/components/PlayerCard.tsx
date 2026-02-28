import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ArrowRight } from 'lucide-react'
import type { Player, Team } from '../lib/supabase'

interface PlayerCardProps {
  player: Player
  onMoveToTeam: (playerId: number, team: Team) => void
  onDelete: (playerId: number) => void
}

export default function PlayerCard({
  player,
  onMoveToTeam,
  onDelete,
}: PlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const otherTeams = (['unassigned', 'team_a', 'team_b'] as Team[]).filter(
    (t) => t !== player.team,
  )

  const teamLabel: Record<Team, string> = {
    unassigned: 'Atanmamış',
    team_a: 'Takım A',
    team_b: 'Takım B',
  }

  const teamButtonColor: Record<Team, string> = {
    unassigned: 'hover:bg-neutral-700/60 text-neutral-300',
    team_a: 'hover:bg-neutral-600/60 text-neutral-200 ',
    team_b: 'hover:bg-neutral-600/60 text-neutral-200',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all ${
        isDragging
          ? 'z-50 scale-[1.02] shadow-2xl shadow-black/40 border-neutral-500/50 opacity-90'
          : 'hover:border-border-hover hover:bg-card-hover'
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab rounded p-1 text-text-muted transition hover:bg-white/10 hover:text-text active:cursor-grabbing"
          aria-label="Sürükle"
        >
          <GripVertical size={16} />
        </button>
        <p className="flex-1 truncate font-medium text-sm text-text">
          {player.name}
        </p>
      </div>
      <div className="flex w-full border-t border-border">
        {otherTeams.map((team) => (
          <button
            key={team}
            onClick={() => onMoveToTeam(player.id, team)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-r border-border py-2.5 text-xs font-medium transition last:border-r-0 ${teamButtonColor[team]}`}
          >
            <ArrowRight size={12} />
            {teamLabel[team]}
          </button>
        ))}
        <button
          onClick={() => onDelete(player.id)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-danger transition hover:bg-red-950/50"
        >
          <Trash2 size={12} />
          Sil
        </button>
      </div>
    </div>
  )
}
