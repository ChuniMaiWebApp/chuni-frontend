// ClearLamp and ComboLamp are read as values here, not just as types.
import {
  ClearLamp,
  ComboLamp,
  type AnyScore,
  type ChainLamp,
} from '~~/shared/types/api'

/**
 * The lamps a score earned, each tagged with what kind it is.
 *
 * The kind travels with the label on purpose. Classifying by reading the label
 * back — `label.includes('ALL JUSTICE')` — looks equivalent and is not: the
 * ALL JUSTICE CRITICAL label is the abbreviation `AJC`, which contains neither
 * "ALL JUSTICE" nor "CRITICAL", so it fell through every branch and the rarest
 * achievement in the game rendered in plain grey.
 */

export type LampKind =
  | 'ajc'
  | 'allJustice'
  | 'fullCombo'
  | 'fullChain'
  | 'clear'
  | 'hardClear'
  | 'failed'

export interface LampBadge {
  label: string
  kind: LampKind
}

/** Clears above plain CLEAR, which the gauge modes award. */
const HARD_CLEARS = new Set<ClearLamp>([
  ClearLamp.HARD,
  ClearLamp.BRAVE,
  ClearLamp.ABSOLUTE,
  ClearLamp.CATASTROPHY,
])

const comboBadge = (lamp: ComboLamp | null): LampBadge | null => {
  switch (lamp) {
    case ComboLamp.ALL_JUSTICE_CRITICAL:
      return { label: 'AJC', kind: 'ajc' }
    case ComboLamp.ALL_JUSTICE:
      return { label: 'ALL JUSTICE', kind: 'allJustice' }
    case ComboLamp.FULL_COMBO:
      return { label: 'FULL COMBO', kind: 'fullCombo' }
    default:
      return null
  }
}

const chainBadge = (lamp: ChainLamp | null): LampBadge | null => {
  const label = chainLampLabel(lamp)

  return label === null ? null : { label, kind: 'fullChain' }
}

const clearBadge = (lamp: ClearLamp | null): LampBadge | null => {
  // Null means the source page carried no badge markup at all, which is not
  // the same as failing. Rendering nothing is the only honest option.
  if (lamp === null) return null

  const label = clearLampLabel(lamp)

  if (label === null) return null
  if (lamp === ClearLamp.FAILED) return { label, kind: 'failed' }

  return { label, kind: HARD_CLEARS.has(lamp) ? 'hardClear' : 'clear' }
}

export const scoreLamps = (score: AnyScore): LampBadge[] =>
  [
    comboBadge(score.comboLamp),
    chainBadge(score.chainLamp),
    // A combo lamp supersedes the clear lamp, so CLEAR is only worth showing
    // when there is no FULL COMBO / ALL JUSTICE above it.
    score.comboLamp === ComboLamp.NONE ? clearBadge(score.clearLamp) : null,
  ].filter((badge): badge is LampBadge => badge !== null)
