export type Logo = {
  id: string
  author_id: string
  image_url: string
  label: string
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export type Vote = {
  id: string
  voter_id: string
  logo_id: string
  rank: 1 | 2 | 3
  created_at: string
}

export type Settings = {
  id: number
  voting_open: boolean
  reveal_authors: boolean
}

export type ScoredEntry = {
  logo: Logo & { displayNum: number }
  score: number
  counts: { r1: number; r2: number; r3: number }
}
