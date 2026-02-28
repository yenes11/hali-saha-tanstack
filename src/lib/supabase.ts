import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Team = 'unassigned' | 'team_a' | 'team_b'

export interface Player {
  id: number
  name: string
  team: Team
  created_at: string
}
