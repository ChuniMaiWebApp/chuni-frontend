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

/**
 * Difficulty colours, sampled from the game's own `musiclevel_*.png` plates.
 *
 * ULTIMA is the odd one: its plate is near-black `#141414` with a pink-red
 * keyline, not the plain dark red this used to carry. Black is unusable as an
 * ink on a dark page, so callers that need a visible line use
 * {@link difficultyInk} while the plate itself keeps the true colour.
 */
const DIFFICULTY_COLOUR: Record<Difficulty, string> = {
  [Difficulty.BASIC]: '#009f7b',
  [Difficulty.ADVANCED]: '#f47900',
  [Difficulty.EXPERT]: '#e92829',
  [Difficulty.MASTER]: '#8c1be1',
  [Difficulty.ULTIMA]: '#141414',
  [Difficulty.WORLDS_END]: '#0c6af2',
}

/**
 * What ULTIMA is drawn in outside its own plate.
 *
 * Not the game's pink-red keyline. At label size that pink was most of what
 * you saw and ULTIMA read as a second EXPERT — which is the one thing it must
 * not do. A neutral separates it from all five coloured difficulties, the same
 * job black does on the cabinet, and works as a border on either theme.
 */
export const ULTIMA_NEUTRAL = '#9a8f9e'

/** The cream the game prints every difficulty name in. */
export const DIFFICULTY_TEXT = '#f9f9db'

export const difficultyLabel = (difficulty: Difficulty): string =>
  DIFFICULTY_LABEL[difficulty] ?? 'UNKNOWN'

export const difficultyColour = (difficulty: Difficulty): string =>
  DIFFICULTY_COLOUR[difficulty] ?? 'var(--color-muted)'

/**
 * The difficulty colour as a visible line or label.
 *
 * Same as {@link difficultyColour} everywhere except ULTIMA, whose true colour
 * is black and would vanish into a dark page. Use this for borders and text;
 * use `difficultyColour` for a filled plate.
 */
export const difficultyInk = (difficulty: Difficulty): string =>
  difficulty === Difficulty.ULTIMA
    ? ULTIMA_NEUTRAL
    : difficultyColour(difficulty)

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
  const value = chartLevelValue(score)

  return value === null ? difficulty : `${difficulty} ${value}`
}

/**
 * The number to print next to a difficulty name.
 *
 * The cached shape spells the chart constant `const`; the live one
 * `internalLevel`. Either beats the displayed level, which rounds 15.6 to 15+.
 */
export const chartLevelValue = (score: AnyScore): string | number | null => {
  const chart = score.chart
  const constant = 'internalLevel' in chart ? chart.internalLevel : chart.const

  return constant ?? chart.level ?? null
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
