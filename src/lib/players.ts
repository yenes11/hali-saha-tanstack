import { createServerFn } from '@tanstack/react-start'
import { sql } from './db'

export type Team = 'unassigned' | 'team_a' | 'team_b'

export interface Player {
  id: number
  name: string
  team: Team
  created_at: string
}

const MAX_PLAYERS = 16

export const getPlayers = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await sql`
      select id, name, team, created_at
      from players
      order by created_at asc
    `
    return rows as unknown as Player[]
  },
)

export const addPlayer = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const [{ count }] = (await sql`select count(*)::int as count from players`) as unknown as [
      { count: number },
    ]
    if (count >= MAX_PLAYERS) {
      throw new Error('Maksimum oyuncu sayısına ulaşıldı')
    }

    const [player] = (await sql`
      insert into players (name, team)
      values (${data.name}, 'unassigned')
      returning id, name, team, created_at
    `) as unknown as Player[]
    return player
  })

export const updatePlayerTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: { playerId: number; team: Team }) => data)
  .handler(async ({ data }) => {
    await sql`
      update players set team = ${data.team} where id = ${data.playerId}
    `
  })

export const deletePlayer = createServerFn({ method: 'POST' })
  .inputValidator((data: { playerId: number }) => data)
  .handler(async ({ data }) => {
    await sql`delete from players where id = ${data.playerId}`
  })

export const deleteTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: { team: Team }) => data)
  .handler(async ({ data }) => {
    await sql`delete from players where team = ${data.team}`
  })
