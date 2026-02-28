import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import TeamColumn from './TeamColumn'
import PlayerCard from './PlayerCard'
import PlayerInput from './PlayerInput'
import { supabase, type Player, type Team } from '../lib/supabase'

const MAX_PLAYERS = 14

const COLUMNS: { team: Team; title: string; color: string }[] = [
  { team: 'unassigned', title: 'Atanmamış', color: '#a3a3a3' },
  { team: 'team_a', title: 'Takım A', color: '#737373' },
  { team: 'team_b', title: 'Takım B', color: '#525252' },
]

export default function KanbanBoard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const fetchPlayers = useCallback(async () => {
    setError(null)
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        setError(error.message ?? 'Veritabanı hatası')
        setPlayers([])
        return
      }
      setPlayers(data ?? [])
    } catch (e) {
      const msg =
        e instanceof TypeError && e.message.includes('fetch')
          ? "Supabase'e bağlanılamadı. .env dosyasını kontrol edin, Supabase projenizin aktif olduğundan emin olun ve players tablosunu oluşturun."
          : e instanceof Error
            ? e.message
            : 'Beklenmeyen hata'
      setError(msg)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const getTeamPlayers = (team: Team) => players.filter((p) => p.team === team)

  const addPlayer = async (name: string) => {
    const { data: existing } = await supabase
      .from('players')
      .select('id')
    if ((existing?.length ?? 0) >= MAX_PLAYERS) return

    const tempId = -Date.now()
    const optimisticPlayer: Player = {
      id: tempId,
      name,
      team: 'unassigned',
      created_at: new Date().toISOString(),
    }
    setPlayers((prev) => [...prev, optimisticPlayer])

    const { data, error } = await supabase
      .from('players')
      .insert({ name, team: 'unassigned' })
      .select()
      .single()

    if (error) {
      setPlayers((prev) => prev.filter((p) => p.id !== tempId))
      console.error('Oyuncu eklenirken hata:', error)
      return
    }
    setPlayers((prev) => prev.map((p) => (p.id === tempId ? data : p)))
  }

  const moveToTeam = async (playerId: number, team: Team) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, team } : p)),
    )

    const { error } = await supabase
      .from('players')
      .update({ team })
      .eq('id', playerId)

    if (error) {
      console.error('Oyuncu taşınırken hata:', error)
      fetchPlayers()
    }
  }

  const deletePlayer = async (playerId: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId))

    const { error } = await supabase.from('players').delete().eq('id', playerId)

    if (error) {
      console.error('Oyuncu silinirken hata:', error)
      fetchPlayers()
    }
  }

  const clearTeam = async (team: Team) => {
    const teamPlayerIds = getTeamPlayers(team).map((p) => p.id)
    if (teamPlayerIds.length === 0) return

    setPlayers((prev) => prev.filter((p) => p.team !== team))

    const { error } = await supabase.from('players').delete().eq('team', team)

    if (error) {
      console.error('Takım temizlenirken hata:', error)
      fetchPlayers()
    }
  }

  const findPlayerTeam = (id: number): Team | undefined =>
    players.find((p) => p.id === id)?.team

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activePlayerId = active.id as number
    const activeTeam = findPlayerTeam(activePlayerId)

    const overTeam =
      COLUMNS.find((c) => c.team === over.id)?.team ??
      findPlayerTeam(over.id as number)

    if (!activeTeam || !overTeam || activeTeam === overTeam) return

    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayerId ? { ...p, team: overTeam } : p)),
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activePlayerId = active.id as number
    const overPlayerId = over.id as number

    const activePlayer = players.find((p) => p.id === activePlayerId)
    if (!activePlayer) return

    const currentTeam = activePlayer.team
    const overIsColumn = COLUMNS.some((c) => c.team === over.id)

    if (overIsColumn) {
      const targetTeam = over.id as Team
      if (currentTeam !== targetTeam) {
        const { error } = await supabase
          .from('players')
          .update({ team: targetTeam })
          .eq('id', activePlayerId)
        if (error) fetchPlayers()
      }
      return
    }

    const overPlayerTeam = findPlayerTeam(overPlayerId)

    if (currentTeam === overPlayerTeam && currentTeam) {
      const teamPlayers = players.filter((p) => p.team === currentTeam)
      const oldIndex = teamPlayers.findIndex((p) => p.id === activePlayerId)
      const newIndex = teamPlayers.findIndex((p) => p.id === overPlayerId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(teamPlayers, oldIndex, newIndex)
        setPlayers((prev) => {
          const others = prev.filter((p) => p.team !== currentTeam)
          return [...others, ...reordered]
        })
      }
    }

    if (currentTeam !== overPlayerTeam && overPlayerTeam) {
      const { error } = await supabase
        .from('players')
        .update({ team: overPlayerTeam })
        .eq('id', activePlayerId)
      if (error) fetchPlayers()
    }
  }

  const activePlayer = activeId ? players.find((p) => p.id === activeId) : null

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-red-900/40 bg-red-950/30 px-6 py-8">
          <h2 className="mb-2 text-lg font-semibold text-red-400">
            Bağlantı Hatası
          </h2>
          <p className="mb-4 text-sm text-text-muted">{error}</p>
          <p className="mb-4 text-xs text-text-muted">
            Supabase Dashboard → SQL Editor üzerinden players tablosunu
            oluşturduğunuzdan emin olun. Proje duraklatılmışsa yeniden başlatın.
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchPlayers()
            }}
            className="rounded-xl bg-neutral-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Halı Saha Kadro
        </h1>
        <span className="my-4 inline-block rounded-full border border-neutral-600 bg-neutral-800 px-3 py-1 text-sm text-text-muted">
          Toplam oyuncu: &nbsp;
          <span className="font-bold text-text">{players.length}</span>/
          {MAX_PLAYERS}
        </span>
        <p className="text-sm text-text-muted">
          Oyuncuları ekle, takımlara dağıt, sürükle-bırak ile sırala
        </p>
      </div>

      <div className="mx-auto mb-6 max-w-md">
        <PlayerInput
          onAdd={addPlayer}
          disabled={players.length >= MAX_PLAYERS}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <TeamColumn
              key={col.team}
              team={col.team}
              title={col.title}
              accentColor={col.color}
              players={getTeamPlayers(col.team)}
              onMoveToTeam={moveToTeam}
              onDelete={deletePlayer}
              onClearTeam={clearTeam}
            />
          ))}
        </div>

        <DragOverlay>
          {activePlayer ? (
            <div className="opacity-80">
              <PlayerCard
                player={activePlayer}
                onMoveToTeam={() => {}}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
