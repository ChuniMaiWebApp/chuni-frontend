import {
  ChainLamp,
  ClearLamp,
  ComboLamp,
  Difficulty,
  Rank,
  type AnyScore,
} from '~~/shared/types/api'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  [Difficulty.BASIC]: 'BASIC',
  [Difficulty.ADVANCED]: 'ADVANCED',
  [Difficulty.EXPERT]: 'EXPERT',
  [Difficulty.MASTER]: 'MASTER',
  [Difficulty.ULTIMA]: 'ULTIMA',
  [Difficulty.WORLDS_END]: "WORLD'S END",
}

/** Difficulty colours as the game uses them. */
const DIFFICULTY_COLOUR: Record<Difficulty, string> = {
  [Difficulty.BASIC]: '#009f7b',
  [Difficulty.ADVANCED]: '#f47900',
  [Difficulty.EXPERT]: '#e92829',
  [Difficulty.MASTER]: '#8c1be1',
  [Difficulty.ULTIMA]: '#c80000',
  [Difficulty.WORLDS_END]: '#0b6ff3',
}

export const difficultyLabel = (difficulty: Difficulty): string =>
  DIFFICULTY_LABEL[difficulty] ?? 'UNKNOWN'

export const difficultyColour = (difficulty: Difficulty): string =>
  DIFFICULTY_COLOUR[difficulty] ?? 'var(--color-muted)'

/** `SSP` is displayed as `SS+`. */
export const rankLabel = (rank: Rank): string =>
  (Rank[rank] ?? 'D').replace('P', '+')

// A `null` lamp means the page had no badge data. Rendering nothing is correct
// there; rendering "FAILED" would be inventing a result.

export const clearLampLabel = (lamp: ClearLamp | null): string | null =>
  lamp === null ? null : lamp === ClearLamp.FAILED ? 'FAILED' : ClearLamp[lamp]

export const comboLampLabel = (lamp: ComboLamp | null): string | null => {
  switch (lamp) {
    case ComboLamp.FULL_COMBO: return 'FULL COMBO'
    case ComboLamp.ALL_JUSTICE: return 'ALL JUSTICE'
    case ComboLamp.ALL_JUSTICE_CRITICAL: return 'AJC'
    default: return null
  }
}

export const chainLampLabel = (lamp: ChainLamp | null): string | null => {
  switch (lamp) {
    case ChainLamp.FULL_CHAIN: return 'FULL CHAIN'
    case ChainLamp.FULL_CHAIN_PLUS: return 'FULL CHAIN+'
    default: return null
  }
}

export const formatScore = (score: number): string =>
  score.toLocaleString('en-US')

/** Ratings are shown to two decimals, OVER POWER to three. */
export const formatRating = (rating: number | null): string =>
  rating === null ? '—' : rating.toFixed(2)

/** `—` when the combo lamp is unknown, since the bonus cannot be applied. */
export const formatOverpower = (score: AnyScore): string => {
  if (score.overpower === null || score.maxOverpower === null) return '—'

  const percentage = Math.floor((score.overpower / score.maxOverpower) * 10_000) / 100

  return `${score.overpower.toFixed(3)} (${percentage.toFixed(2)}%)`
}

/** `MASTER 15.6`, falling back to the displayed level when no constant is known. */
export const chartLabel = (score: AnyScore): string => {
  const difficulty = difficultyLabel(score.chart.difficulty)
  // The cached shape spells the chart constant `const`; the live one
  // `internalLevel`. Either beats the displayed level, which rounds 15.6 to 15+.
  const chart = score.chart
  const constant = 'internalLevel' in chart ? chart.internalLevel : chart.const
  const value = constant ?? chart.level

  return value ? `${difficulty} ${value}` : difficulty
}

/**
 * Pulls a readable message out of whatever `$fetch` rejected with — Nest's
 * error envelope when the server answered, the transport error otherwise.
 */
export const readApiError = (error: unknown): string => {
  const data = (error as { data?: { message?: string | string[] } })?.data

  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message
  }

  return (error as Error)?.message ?? 'Something went wrong.'
}

export const formatDateTime = (iso: string | null): string => {
  if (!iso) return '—'

  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
