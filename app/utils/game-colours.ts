import { Rank } from '~~/shared/types/api'

/**
 * The game's own colours, measured from SEGA's artwork.
 *
 * Every value here was read out of a PNG served by `chunithm-net-eng.com` —
 * decoded, pixels sampled — not recalled and not taken from a wiki. Two things
 * everyone gets wrong and this file does not: CHUNITHM's `silver` is icy blue
 * rather than grey, and its `purple` is magenta rather than violet.
 *
 * Tier names are SEGA's own: they come from the image filenames
 * (`rating/rating_<tier>_<digit>.png`), confirmed by probing which names the
 * CDN serves. That is how we know it is `bronze` and not `copper`, which most
 * community sources say.
 *
 * See design/00-game-colours.md for the measurements and their provenance.
 */

export type RatingTier =
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'rainbow'

/**
 * Rating bands, lowest first.
 *
 * Confidence is uneven and worth stating: the tier names and colours are
 * measured, but only two boundaries are confirmed against real accounts — a
 * 15.10 rating renders `gold` and a 16.13 renders `rainbow`. The rest follow
 * community documentation. They live in this one table so a correction is a
 * one-line change rather than a hunt.
 */
const RATING_BANDS: Array<{ from: number, tier: RatingTier }> = [
  { from: 16.0, tier: 'rainbow' },
  { from: 15.25, tier: 'platinum' },
  { from: 14.5, tier: 'gold' },
  { from: 13.25, tier: 'silver' },
  { from: 12.0, tier: 'bronze' },
  { from: 10.0, tier: 'purple' },
  { from: 7.0, tier: 'red' },
  { from: 4.0, tier: 'orange' },
  { from: 0, tier: 'green' },
]

export const ratingTier = (rating: number): RatingTier =>
  RATING_BANDS.find(band => rating >= band.from)?.tier ?? 'green'

/**
 * Core and highlight colour per tier, as sampled.
 *
 * `rainbow` has no single colour; it is a gradient and callers must treat it
 * as one. `rainbowStops` carries it.
 */
export const RATING_COLOUR: Record<RatingTier, { core: string, light: string }> = {
  green: { core: '#32fd23', light: '#baff48' },
  orange: { core: '#f5b404', light: '#ffd803' },
  red: { core: '#fd576b', light: '#ff9397' },
  purple: { core: '#fd66f5', light: '#ff96df' },
  bronze: { core: '#db570a', light: '#ffad3c' },
  silver: { core: '#8ae7ff', light: '#c3feff' },
  gold: { core: '#f6cb11', light: '#fff368' },
  platinum: { core: '#fff9e5', light: '#ffffff' },
  // Sampled from the artwork's own sweep: warm, through lime, to cyan.
  rainbow: { core: '#ff957a', light: '#79fff8' },
}

/** Gradient stops for the two five-colour treatments: rating 16+, and SSS+. */
export const RAINBOW_STOPS = [
  '#ff957a',
  '#ffe45e',
  '#caff22',
  '#28ffbd',
  '#15fff3',
  '#f847ff',
]

/**
 * Rank badge colours, indexed to match the `Rank` enum.
 *
 * S through SSS deliberately share one colour: SEGA's artwork does too, and
 * the game separates them by badge shape and metallic sheen rather than hue.
 * Inventing five distinct colours here would be a lie about the game.
 */
export const RANK_COLOUR: Record<Rank, string> = {
  [Rank.D]: '#a9a7a5',
  [Rank.C]: '#ff9944',
  [Rank.B]: '#8affff',
  [Rank.BB]: '#a3ffff',
  [Rank.BBB]: '#b8ffff',
  [Rank.A]: '#fff525',
  [Rank.AA]: '#fff625',
  [Rank.AAA]: '#fff717',
  [Rank.S]: '#fbecad',
  [Rank.SP]: '#fbecad',
  [Rank.SS]: '#fbecad',
  [Rank.SSP]: '#fbecad',
  [Rank.SSS]: '#fbecad',
  // Iridescent in the artwork; treated as a gradient like rating 16+.
  [Rank.SSSP]: '#00bae8',
}

/** SSS+ and rating 16+ are the only two values the game renders multi-hue. */
export const isIridescentRank = (rank: Rank): boolean => rank === Rank.SSSP

export const rankColour = (rank: Rank): string =>
  RANK_COLOUR[rank] ?? 'var(--color-muted)'
