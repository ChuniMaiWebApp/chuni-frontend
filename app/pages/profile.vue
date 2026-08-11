<script setup lang="ts">
import type {
  LinkedGateProgress,
  LoginBonus,
  Profile,
} from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmWebApp · Profile' })

const api = useApi()

/*
 * Not awaited: this is two CHUNITHM-NET pages (player card plus collections
 * for the nameplate), and awaiting it in setup left the previous tab on screen
 * for the whole trip.
 */
const { data: profile, error, pending, refresh } = await useApiFetch<Profile>(
  '/chunithm/profile',
  { lazy: true },
)

const showFriendCode = ref(false)

// --- Renaming ----------------------------------------------------------------

const renaming = ref(false)
const newName = ref('')
const renameBusy = ref(false)
const toast = useToast()

const renameError = ref<string | null>(null)

const startRename = () => {
  newName.value = profile.value?.username ?? ''
  renameError.value = null
  renaming.value = true
}

/** The one write this app makes to a CHUNITHM account. */
const submitRename = async () => {
  renameBusy.value = true
  renameError.value = null

  try {
    await api('/chunithm/profile/name', {
      method: 'PATCH',
      body: { name: newName.value },
    })
    renaming.value = false
    await refresh()
    toast.success('Đổi tên thành công!', 'Tên tài khoản CHUNITHM đã được cập nhật.')
  }
  catch (caught) {
    const errText = readApiError(caught)
    renameError.value = errText
    toast.error('Đổi tên thất bại', errText || 'Không thể thay đổi tên.')
  }
  finally {
    renameBusy.value = false
  }
}

// --- Extras, loaded on demand ------------------------------------------------
// Each costs a request to CHUNITHM-NET, so neither loads with the page.

const loginBonus = ref<LoginBonus | null>(null)
const gates = ref<LinkedGateProgress[] | null>(null)
const extrasError = ref<string | null>(null)
const extrasBusy = ref(false)

const loadExtras = async () => {
  extrasBusy.value = true
  extrasError.value = null

  try {
    const [bonus, progress] = await Promise.all([
      api<LoginBonus>('/chunithm/login-bonus'),
      api<LinkedGateProgress[]>('/chunithm/linked-verse'),
    ])

    loginBonus.value = bonus
    gates.value = progress
  }
  catch (caught) {
    extrasError.value = readApiError(caught)
  }
  finally {
    extrasBusy.value = false
  }
}

const stats = computed(() => {
  if (!profile.value) return []

  return [
    { label: 'Level', value: profile.value.level ?? '—' },
    {
      label: 'OVER POWER',
      value: profile.value.overPower
        ? `${profile.value.overPower.value.toFixed(2)} (${profile.value.overPower.percentage.toFixed(2)}%)`
        : '—',
    },
    { label: 'Credits Played', value: profile.value.totalCredits ?? '—' },
    {
      label: 'Currency Points',
      value: profile.value.currency
        ? profile.value.currency.owned.toLocaleString('en-US')
        : '—',
    },
    { label: 'Last Played', value: formatDateTime(profile.value.lastPlayed) },
  ]
})

const translateBonus = (text: string) => {
  if (!text) return ''
  const translated = text
    .replace(/キャラクターEXP/g, 'Char EXP')
    .replace(/マップマス数/g, 'Map Steps')
    .replace(/超アバターチャンス/g, 'Super Avatar Chance')
    .replace(/アバターチャンス/g, 'Avatar Chance')
    .replace(/マップのメモリー/g, 'Map Memory')
    .replace(/ペンギンスタンプ/g, 'Penguin Stamp')
    .replace(/×(\d+(?:\.\d+)?)倍?/g, ' ×$1')
    .replace(/\+(\d+)/g, ' +$1')
    .replace(/＋(\d+)/g, ' +$1')

  return translated !== text ? translated : ''
}
</script>

<template>
  <section class="profile-page">
    <header class="page-header">
      <div>
        <h1>Player Profile</h1>
        <p class="page-subtitle">Your CHUNITHM-NET player card &amp; account details</p>
      </div>
      <button type="button" class="btn btn--secondary" :disabled="pending" @click="refresh()">
        <AppIcon name="refresh" />
        {{ pending ? 'Refreshing…' : 'Refresh' }}
      </button>
    </header>

    <ApiError v-if="error" :error="error" />

    <AppSpinner
      v-else-if="pending && !profile"
      label="Fetching your player card from CHUNITHM-NET…"
    />

    <template v-else-if="profile">
      <div class="card player-card">
        <div class="player-card__main">
          <div class="player-card__avatar-box">
            <img
              v-if="profile.profilePicture"
              :src="profile.profilePicture"
              alt="Avatar"
              class="player-card__avatar"
              width="88"
              height="88"
            >
            <div v-else class="player-card__avatar-placeholder" />
          </div>

          <div class="player-card__info">
            <p v-if="profile.titles.length" class="player-card__titles">
              <HonorPlate
                v-for="title in profile.titles"
                :key="title.content"
                :rarity="title.rarity"
              >{{ title.content }}</HonorPlate>
            </p>

            <div class="player-card__name-row">
              <h2 class="player-card__name">{{ profile.username }}</h2>
              <button type="button" class="rename-toggle" @click="startRename">
                <AppIcon name="edit" /> Rename
              </button>
            </div>

            <form v-if="renaming" class="rename" @submit.prevent="submitRename">
              <input
                v-model="newName"
                type="text"
                maxlength="8"
                placeholder="Up to 8 characters"
                required
              >
              <button type="submit" class="btn btn--primary btn--sm" :disabled="renameBusy || !newName">
                {{ renameBusy ? 'Saving…' : 'Save' }}
              </button>
              <button type="button" class="btn btn--outline btn--sm" @click="renaming = false">Cancel</button>
              <small class="rename__note">This changes your name in the game itself via CHUNITHM-NET.</small>
              <small v-if="renameError" class="rename__error">{{ renameError }}</small>
            </form>

            <p v-if="profile.team" class="player-card__team">
              Team: <strong>{{ profile.team.name }}</strong>
            </p>

            <!-- CHUNITHM wide banner artwork -->
            <img
              v-if="profile.banner"
              :src="profile.banner"
              alt="Name plate"
              class="player-card__banner"
              loading="lazy"
            >

            <div v-if="profile.friendCode" class="player-card__code">
              <button type="button" class="btn btn--secondary btn--sm" @click="showFriendCode = !showFriendCode">
                <AppIcon :name="showFriendCode ? 'eyeOff' : 'eye'" />
                {{ showFriendCode ? 'Hide' : 'Show' }} Friend Code
              </button>
              <code v-if="showFriendCode" class="code-box tabular">{{ profile.friendCode }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-header">
        <h2>Player Statistics</h2>
      </div>

      <dl class="stats-grid">
        <div class="card stat-card stat-card--rating">
          <dt class="stat-card__label">Player Rating</dt>
          <dd class="stat-card__value">
            <RatingValue
              v-if="profile"
              :rating="profile.rating"
              kind="player"
              size="lg"
            />
          </dd>
        </div>

        <div v-for="stat in stats" :key="stat.label" class="card stat-card">
          <dt class="stat-card__label">{{ stat.label }}</dt>
          <dd class="stat-card__value tabular">{{ stat.value }}</dd>
        </div>
      </dl>

      <!-- Extras Section -->
      <section class="extras">
        <header class="extras__header">
          <div>
            <h2>Login Bonus &amp; Linked VERSE Gates</h2>
            <span class="extras__subtitle">Fetch additional account events &amp; gate status</span>
          </div>
          <button type="button" class="btn btn--secondary" :disabled="extrasBusy" @click="loadExtras">
            <AppIcon :name="loginBonus ? 'refresh' : 'download'" />
            {{ extrasBusy ? 'Loading…' : loginBonus ? 'Reload extras' : 'Load extras' }}
          </button>
        </header>

        <p v-if="extrasError" class="extras__error">{{ extrasError }}</p>

        <template v-else-if="loginBonus">
          <div class="card bonus-card">
            <h3 class="bonus-card__title">Monthly &amp; Daily Login Bonus</h3>
            <p class="extras__status">
              Today's collection status:
              <span class="badge-status" :class="loginBonus.receivedToday ? 'badge-status--yes' : 'badge-status--no'">
                {{ loginBonus.receivedToday ? 'Collected ' : 'Not yet collected ⏳' }}
              </span>
            </p>

            <ul v-if="loginBonus.daily.length" class="weekdays">
              <li
                v-for="day in loginBonus.daily"
                :key="day.weekday"
                :class="{ today: day.isToday }"
              >
                <span class="weekday-name">{{ ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day.weekday] }}</span>
                <small class="weekday-bonus">{{ day.bonus }}</small>
                <small v-if="translateBonus(day.bonus)" class="weekday-bonus-en">{{ translateBonus(day.bonus) }}</small>
              </li>
            </ul>

            <p v-if="loginBonus.streak.length" class="extras__streak">
              Streak rewards: <strong>{{ loginBonus.streak.filter((item) => item.obtained).length }}</strong> of <strong>{{ loginBonus.streak.length }}</strong> collected
            </p>
          </div>

          <!-- Linked VERSE Gate Matrix -->
          <div v-if="gates?.length" class="card gates-section">
            <h3 class="gates-section__title">Linked VERSE Gate Status (10 Gates)</h3>
            <div class="gates-grid">
              <GateStatus v-for="gate in gates" :key="gate.gate" :gate="gate" />
            </div>
          </div>
        </template>
      </section>
    </template>
  </section>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
}

.page-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  padding: 1.25rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.player-card__main {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.player-card__avatar {
  border-radius: var(--radius);
  object-fit: cover;
}

.player-card__avatar-placeholder {
  width: 88px;
  height: 88px;
  border-radius: var(--radius);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.player-card__info {
  flex: 1;
  min-width: 0;
}

.player-card__titles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0 0 0.5rem;
}

.player-card__title-tag {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.player-card__name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-card__name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
}

.player-card__team {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.player-card__banner {
  display: block;
  width: 100%;
  max-width: 26rem;
  height: auto;
  margin-top: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.player-card__code {
  margin: 0.875rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
}

.code-box {
  padding: 0.3rem 0.6rem;
  background: var(--color-game-chip-bg);
  color: var(--color-game-chip-text);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
}

/* Rename Controls */
.rename-toggle {
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.rename-toggle:hover {
  color: var(--color-text);
  border-color: var(--color-accent);
}

.rename {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius);
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
}

.rename input {
  font: inherit;
  font-size: 0.9375rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  width: 11rem;
}

.rename__note {
  flex-basis: 100%;
  font-size: 0.75rem;
  color: var(--color-muted);
  margin-top: 0.25rem;
}

.rename__error {
  color: var(--color-down);
  font-weight: 600;
}

/* Stats Section */
.stats-header h2 {
  font-size: 1.25rem;
  font-weight: 750;
  margin: 0.5rem 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
  gap: 0.875rem;
  margin: 0;
}

.stat-card {
  padding: 1rem 1.125rem;
}

/* The rating is the loudest thing on this page by colour alone; an accented
   border and a gradient behind it were two more frames doing the same job. */
.stat-card--rating .stat-card__value {
  margin-top: 0.5rem;
}

.stat-card__label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.stat-card__value {
  margin: 0.35rem 0 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
}

/* Extras */
.extras {
  margin-top: 0.5rem;
}

.extras__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.875rem;
}

.extras__header h2 {
  font-size: 1.25rem;
  font-weight: 750;
  margin: 0;
}

.extras__subtitle {
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.extras__error {
  color: var(--color-down);
  font-weight: 600;
  font-size: 0.875rem;
}

.bonus-card__title,
.gates-section__title {
  font-size: 0.9375rem;
  font-weight: 750;
  margin: 0 0 0.625rem;
}

.badge-status {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;

  display: inline-block;
  margin-left: 0.35rem;
}

.badge-status--yes {
  background: rgba(52, 211, 153, 0.15);
  color: var(--color-up);
}

.badge-status--no {
  background: rgba(248, 113, 113, 0.15);
  color: var(--color-down);
}

.weekdays {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.875rem 0 0;
  padding: 0;
}

.weekdays li {
  flex: 1 1 5rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.weekdays li.today {
  border-color: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent-subtle);
}

.weekday-name {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.weekday-bonus {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
  display: block;
}

.weekday-bonus-en {
  display: block;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-accent);
  margin-top: 0.15rem;
  line-height: 1.25;
}

.extras__streak {
  margin-top: 0.875rem;
  font-size: 0.875rem;
  color: var(--color-muted);
}

/* Gates Grid */
.gates-section {
  margin-top: 0.875rem;
}

.gates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.625rem;
}

/* Gate Status visual distinctions */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}

.btn--primary {
  background: var(--color-accent);
  color: #ffffff;
  border: none;
}

.btn--secondary {
  background: var(--color-surface-hover);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--outline {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--sm {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
}

@media (max-width: 36rem) {
  .player-card__main {
    flex-direction: column;
  }
}
</style>

