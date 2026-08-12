/**
 * Response contracts shared between the Nuxt app and its Nitro server routes.
 * Mirrors the DTOs in `backend/src`.
 */

export interface HelloResponse {
  message: string
  environment: string
  timestamp: string
}

export type DependencyStatus = 'up' | 'down'

export interface HealthResponse {
  status: 'ok' | 'degraded'
  uptime: number
  timestamp: string
  dependencies: Record<string, DependencyStatus>
}

export interface ApiErrorResponse {
  statusCode: number
  message: string | string[]
  error: string
  path: string
  timestamp: string
}

// --- Auth --------------------------------------------------------------------

export interface SessionUser {
  id: string
  displayName: string
  friendCode: string | null
}

export interface LoginCode {
  code: string
  pollToken: string
  expiresInSeconds: number
}

export type LoginStatus =
  | { status: 'pending' }
  | { status: 'linked', token: string, user: SessionUser }
  | { status: 'failed', error: string }
  | { status: 'expired' }

// --- CHUNITHM ----------------------------------------------------------------
// Numeric enums are kept in sync with backend/src/shared/chunithm-net.

export enum Difficulty {
  BASIC = 0,
  ADVANCED = 1,
  EXPERT = 2,
  MASTER = 3,
  ULTIMA = 4,
  WORLDS_END = 5,
}

export enum Rank {
  D = 0, C = 1, B = 2, BB = 3, BBB = 4, A = 5, AA = 6, AAA = 7,
  S = 8, SP = 9, SS = 10, SSP = 11, SSS = 12, SSSP = 13,
}

export enum ClearLamp {
  FAILED = 0,
  CLEAR = 1,
  HARD = 4,
  BRAVE = 5,
  ABSOLUTE = 6,
  CATASTROPHY = 7,
}

export enum ComboLamp {
  NONE = 0,
  FULL_COMBO = 1,
  ALL_JUSTICE = 2,
  ALL_JUSTICE_CRITICAL = 3,
}

export enum ChainLamp {
  NONE = 0,
  FULL_CHAIN_PLUS = 1,
  FULL_CHAIN = 2,
}

export interface Judgements {
  justiceCritical: number
  justice: number
  attack: number
  miss: number
}

export interface NotePercentage {
  tap: number
  hold: number
  slide: number
  air: number
  flick: number
}

/**
 * Score lost to each imperfect judgement.
 *
 * CHUNITHM-NET reports the counts but never what they cost; the server does
 * the arithmetic once, against the chart's notecount.
 */
export interface JudgementLoss {
  justice: number
  attack: number
  miss: number
  /** The three added up — what a perfect play would have scored instead. */
  total: number
}

export interface Score {
  song: { id: number | null, title: string, jacketUrl: string | null }
  chart: {
    difficulty: Difficulty
    level: string | null
    internalLevel: number | null
    maxCombo: number | null
  }
  score: number
  rank: Rank
  /**
   * `null` means the source page carried no badges at all, which is not the
   * same as FAILED — the rating detail pages list only score and difficulty.
   */
  clearLamp: ClearLamp | null
  comboLamp: ComboLamp | null
  chainLamp: ChainLamp | null
  maxCombo: number | null
  judgements: Judgements | null
  notePercentage: NotePercentage | null
  achievedAt: string | null
  rating: number | null
  overpower: number | null
  maxOverpower: number | null
  judgementLoss: JudgementLoss | null
}

export interface RecentScore extends Score {
  trackNo: number | null
  isNewRecord: boolean
  character: string | null
  skill: { name: string, grade: number | null } | null
  skillResult: number | null
  playlogIndex: number | null
}

export interface PersonalBest extends Score {
  playCount: number | null
  ajcCount: number | null
}

export interface RatingBreakdown {
  rating: number
  best: { slots: number, scores: PersonalBest[] }
  new: { slots: number, scores: PersonalBest[] }
}

// --- Improvement tools -------------------------------------------------------

export interface WhatIfResult {
  currentRating: number
  newRating: number
  delta: number
  /** Play rating this score would push out of the counted set. */
  displaces: number | null
  counts: boolean
  floor: { best: number | null, new: number | null }
}

export interface ReachResult {
  currentRating: number
  target: number
  alreadyReached: boolean
  /** Play rating every counted slot would need. Null once already reached. */
  requiredPlayRating: number | null
  floors: { best: number | null, new: number | null }
}

export interface Recommendation {
  song: { id: number, title: string, jacketUrl: string | null }
  difficulty: Difficulty
  difficultyName: string
  level: string
  const: number
  sdvxinUrl: string | null
  requiredScore: number
  targetPlayRating: number
}

export interface RecommendResult {
  currentRating: number
  ratingFloor: number
  recommendations: Recommendation[]
}

// --- CHUNITHM-NET extras -----------------------------------------------------

export interface LeaderboardEntry {
  position: number
  playerName: string
  score: number
  ajcCount: number | null
  achievedAt: string | null
}

export interface Leaderboard {
  updatedAt: string | null
  ranking: LeaderboardEntry[]
}

/**
 * Everything known about one player's record on one chart.
 *
 * `play` is the best run found in the last 50 tracks. CHUNITHM-NET publishes
 * judgements only on the playlog, so a record set longer ago comes back
 * without them rather than with invented ones.
 */
export interface ChartRecord {
  song: {
    id: number
    title: string
    artist: string
    genre: string
    version: string
    jacketUrl: string | null
    availability?: SongAvailability
  }
  chart: ChartView
  play: RecentScore | null
  /**
   * A breakdown captured while the run was still in the playlog window.
   *
   * The only way a record older than 50 tracks can have judgements at all —
   * CHUNITHM-NET stops serving them once the play scrolls out.
   */
  captured: {
    score: number
    maxCombo: number | null
    achievedAt: string | null
    capturedAt: string
    judgements: Judgements
    notePercentage: NotePercentage
    judgementLoss: JudgementLoss | null
  } | null
}

export interface CaptureResult {
  scanned: number
  fetched: number
  stored: number
  alreadyKnown: number
}

export interface RankingEntry {
  position: number
  playerName: string
  /** Rating, total high score or currency, depending on which board this is. */
  value: number
}

export interface Ranking {
  updatedAt: string | null
  ranking: RankingEntry[]
}

export interface LoginBonusItem {
  day: number
  name: string
  iconUrl: string | null
  obtained: boolean
}

export interface LoginBonus {
  receivedToday: boolean
  monthly: Array<{
    name: string
    daysLoggedIn: number
    rewards: LoginBonusItem[]
  }>
  streak: LoginBonusItem[]
  daily: Array<{
    weekday: number
    bonus: string
    iconUrl: string | null
    isToday: boolean
  }>
}

export interface LinkedGateProgress {
  gate: string
  /**
   * The game's own badge art for this gate, already drawn in whatever state
   * that gate is in. The only thing reported, because the markup says nothing
   * about the state and the artwork says all of it.
   */
  badgeUrl: string | null
}

// --- Stored records ----------------------------------------------------------

export interface StoredScore {
  song: {
    id: number
    title: string
    jacketUrl: string | null
    genre: string
    version: string
  }
  chart: {
    difficulty: Difficulty
    difficultyName: string
    level: string
    const: number | null
    maxCombo: number | null
  }
  score: number
  rank: Rank
  rankName: string
  clearLamp: ClearLamp | null
  comboLamp: ComboLamp | null
  chainLamp: ChainLamp | null
  judgements: Judgements | null
  maxCombo: number | null
  achievedAt: string | null
  playCount: number | null
  rating: number | null
  overpower: number | null
  maxOverpower: number | null
}

/**
 * Anything `ScoreCard` and the score formatters can render.
 *
 * The live CHUNITHM-NET shapes and the cached one differ in two places — the
 * cache knows the song id for certain and calls the chart constant `const`
 * rather than `internalLevel` — so the display helpers accept the union and
 * narrow, rather than each caller casting.
 */
export type AnyScore = Score | RecentScore | PersonalBest | StoredScore

export interface SyncStatus {
  hasSynced: boolean
  startedAt?: string
  finishedAt?: string | null
  scoreCount?: number | null
  error?: string | null
  /** Freshness of the third-party song dataset, or null if never refreshed. */
  dataset?: {
    refreshedAt: string
    newestRelease: string | null
    songCount: number
    ageDays: number
  } | null
}

export interface SyncResult {
  scoreCount: number
  /** Charts the song database has never heard of — usually songs newer than it. */
  skipped: string[]
}

export interface Statistics {
  filter: {
    level: string | null
    difficulty: string | null
    genre: string | null
    version: string | null
  }
  sync: SyncStatus
  coverage: { played: number, total: number, percentage: number }
  overpower: { value: number, max: number, percentage: number }
  averageScore: { played: number, overAllCharts: number }
  counts: {
    '99AJ': number
    ranks: Record<string, number>
    comboLamps: Record<string, number>
    clearLamps: Record<string, number>
  }
  best: StoredScore | null
  worst: StoredScore | null
}

// --- Song database -----------------------------------------------------------

export interface ChartView {
  difficulty: Difficulty
  difficultyName: string
  level: string
  const: number | null
  maxCombo: number | null
  notes: {
    tap: number | null
    hold: number | null
    slide: number | null
    air: number | null
    flick: number | null
  }
  charter: string | null
  version: string | null
  available: boolean
  /** Null when the regional dataset has no entry for this chart. */
  availableIntl: boolean | null
  availableJp: boolean | null
  sdvxinUrl: string | null
  youtubeUrl: string
}

export interface SongSummary {
  id: number
  title: string
  artist: string
  genre: string
  version: string
  releaseDate: string | null
  bpm: { primary: number | null, min: number | null, max: number | null }
  durationSeconds: number | null
  jacketUrl: string | null
  available: boolean
  removed: boolean
  availableIntl: boolean | null
  availableJp: boolean | null
}

export interface SongSearchResult extends SongSummary {
  /** Which alias matched, when the hit did not come from the title. */
  matchedAlias: string | null
  score: number
  charts?: ChartView[]
}

export interface SongSearchResponse {
  total: number
  page: number
  limit: number
  totalPages: number
  songs: SongSearchResult[]
}

/**
 * Whether a song is playable on CHUNITHM International.
 *
 * A lookup in a dataset that tracks the two regions separately, per chart —
 * not an inference from who has played what. International runs months behind
 * Japan, so `japanOnly` is the ordinary case rather than an error.
 */
export interface SongAvailability {
  status: 'playable' | 'removed' | 'japanOnly' | 'absent' | 'unknown'
  /** Difficulty names Japan has that International does not. */
  chartsMissingHere: string[]
  source: {
    url: string
    publishedAt: string | null
    fetchedAt: string
    ageHours: number | null
  } | null
}

export interface SongDetail extends SongSummary {
  aliases: string[]
  charts: ChartView[]
  availability: SongAvailability
}

export interface ChartSearchResult extends ChartView {
  song: { id: number, title: string, jacketUrl: string | null }
}

export interface Course {
  id: number
  class: string
  name: string
  version: string
  gauge: {
    life: number | null
    recoveryLife: number | null
    clearLife: number | null
    damageMiss: number | null
    damageAttack: number | null
    damageJustice: number | null
    damageJusticeCritical: number | null
  }
  tracks: Array<{
    position: number
    isRandom: boolean
    level: string | null
    song: { id: number, title: string | null, jacketUrl: string | null } | null
    difficulty: string | null
    const: number | null
  }>
}

// --- Tools -------------------------------------------------------------------

export interface OverpowerResult {
  value: number
  max: number
  percentage: number
}

export interface CalculateResult {
  score: number
  chartConst: number
  rank: Rank
  rankName: string
  rating: number
  overpower: OverpowerResult
  lampUpgrades: Array<{ comboLamp: ComboLamp, overpower: OverpowerResult }>
}

export interface BorderResult {
  notecount: number
  chart: { title: string, difficulty: string, level: string } | null
  deduction: { justice: number, attack: number, miss: number }
  borders: Array<{
    label: string
    justiceCritical: number
    justice: number
    attack: number
    miss: number
    minScore: number
  }>
}

export interface AnmitsuResult {
  bpm: number
  noteDensity: number
  distanceMs: number
  criticalOverlapMs: number
  justiceOverlapMs: number
  rub: 'ideal' | 'risky' | 'no'
  anmitsu: 'ideal' | 'risky' | 'no'
}

export interface Profile {
  username: string
  level: number | null
  reincarnationStars: number
  rating: number
  overPower: { value: number, percentage: number } | null
  titles: Array<{
    /** Empty for collaboration titles, whose wording exists only in the image. */
    content: string
    /** Plate to draw `content` on; `special` when the game supplies artwork. */
    rarity: string
    /** Finished artwork, for titles the game draws rather than composes. */
    imageUrl: string | null
  }>
  team: { name: string, emblem: string } | null
  possession: string
  medal: number | null
  emblem: number | null
  profilePicture: string | null
  profilePictureFrame: string | null
  banner: string | null
  friendCode: string | null
  currency: { owned: number, total: number } | null
  totalCredits: number | null
  lastPlayed: string | null
}
