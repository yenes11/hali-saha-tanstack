import { createServerFn } from '@tanstack/react-start'
import { sql } from './db'

export interface MatchInfo {
  startHour: number | null
  locationUrl: string | null
}

export const getMatchInfo = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [row] = await sql`
      select start_hour, location_url
      from match_info
      where id = 1
    `
    return {
      startHour: row?.start_hour ?? null,
      locationUrl: row?.location_url ?? null,
    } as MatchInfo
  },
)

export const updateMatchInfo = createServerFn({ method: 'POST' })
  .inputValidator((data: MatchInfo) => data)
  .handler(async ({ data }) => {
    await sql`
      update match_info
      set start_hour = ${data.startHour},
          location_url = ${data.locationUrl},
          updated_at = now()
      where id = 1
    `
  })
