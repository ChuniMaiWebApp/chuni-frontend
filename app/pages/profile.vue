<script setup lang="ts">
import type {
  LinkedGateProgress,
  LoginBonus,
  Profile,
} from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Profile' })

const api = useApi()

const { data: profile, error, pending, refresh } = await useApiFetch<Profile>(
  '/chunithm/profile',
)

const showFriendCode = ref(false)

// --- Renaming ----------------------------------------------------------------

const renaming = ref(false)
const newName = ref('')
const renameBusy = ref(false)
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
  }
  catch (caught) {
    renameError.value = readApiError(caught)
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

const GATE_LABEL: Record<string, string> = {
  not_found: 'Not found',
  under_analysis: 'Analysing',
  linkable: 'Linkable',
  clear: 'Clear',
  // Shown when the badge artwork is not in our lookup table — an admission
  // rather than a guess, so a new gate never masquerades as "not found".
  unknown: 'Unrecognised badge',
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
    { label: 'Credits', value: profile.value.totalCredits ?? '—' },
    {
      label: 'Points',
      value: profile.value.currency
        ? profile.value.currency.owned.toLocaleString('en-US')
        : '—',
    },
    { label: 'Last played', value: formatDateTime(profile.value.lastPlayed) },
  ]
})
</script>

<template>
  <section>
    <header class="page-header">
      <h1>Profile</h1>
      <button type="button" :disabled="pending" @click="refresh()">
        {{ pending ? 'Refreshing…' : 'Refresh' }}
      </button>
    </header>

    <ApiError v-if="error" :error="error" />

    <template v-else-if="profile">
      <div class="card player">
        <img
          v-if="profile.profilePicture"
          :src="profile.profilePicture"
          alt=""
          class="player__avatar"
          width="88"
          height="88"
        >

        <div class="player__body">
          <p v-if="profile.titles.length" class="player__titles">
            <span
              v-for="title in profile.titles"
              :key="title.content"
              class="player__title"
              :data-rarity="title.rarity"
            >{{ title.content }}</span>
          </p>

          <h2 class="player__name">
            {{ profile.username }}
            <button type="button" class="rename-toggle" @click="startRename">
              Rename
            </button>
          </h2>

          <form v-if="renaming" class="rename" @submit.prevent="submitRename">
            <input
              v-model="newName"
              type="text"
              maxlength="8"
              placeholder="Up to 8 characters"
              required
            >
            <button type="submit" :disabled="renameBusy || !newName">
              {{ renameBusy ? 'Saving…' : 'Save' }}
            </button>
            <button type="button" @click="renaming = false">Cancel</button>
            <small>This changes your name in the game itself.</small>
            <small v-if="renameError" class="rename__error">{{ renameError }}</small>
          </form>

          <p v-if="profile.team" class="player__team">{{ profile.team.name }}</p>

          <!-- The nameplate, CHUNITHM's wide banner artwork. -->
          <img
            v-if="profile.banner"
            :src="profile.banner"
            alt="Name plate"
            class="player__banner"
            loading="lazy"
          >

          <p v-if="profile.friendCode" class="player__code">
            <button type="button" @click="showFriendCode = !showFriendCode">
              {{ showFriendCode ? 'Hide' : 'Show' }} friend code
            </button>
            <code v-if="showFriendCode">{{ profile.friendCode }}</code>
          </p>
        </div>
      </div>

      <dl class="stats">
        <div class="card stat">
          <dt>Rating</dt>
          <dd>
            <RatingValue
              v-if="profile"
              :rating="profile.rating"
              kind="player"
              size="md"
            />
          </dd>
        </div>
        <div v-for="stat in stats" :key="stat.label" class="card stat">
          <dt>{{ stat.label }}</dt>
          <dd>{{ stat.value }}</dd>
        </div>
      </dl>

      <section class="extras">
        <header class="extras__header">
          <h2>Login bonus &amp; Linked VERSE</h2>
          <button type="button" :disabled="extrasBusy" @click="loadExtras">
            {{ extrasBusy ? 'Loading…' : loginBonus ? 'Reload' : 'Load' }}
          </button>
        </header>

        <p v-if="extrasError" class="extras__error">{{ extrasError }}</p>

        <template v-else-if="loginBonus">
          <div class="card">
            <p class="extras__status">
              Today's bonus:
              <strong>{{ loginBonus.receivedToday ? 'collected' : 'not yet' }}</strong>
            </p>

            <ul v-if="loginBonus.daily.length" class="weekdays">
              <li
                v-for="day in loginBonus.daily"
                :key="day.weekday"
                :class="{ today: day.isToday }"
              >
                <span>{{ ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day.weekday] }}</span>
                <small>{{ day.bonus }}</small>
              </li>
            </ul>

            <p v-if="loginBonus.streak.length" class="extras__streak">
              Streak rewards:
              {{ loginBonus.streak.filter((item) => item.obtained).length }}
              of {{ loginBonus.streak.length }} collected
            </p>
          </div>

          <div v-if="gates?.length" class="card gates">
            <div
              v-for="gate in gates"
              :key="gate.gate"
              class="gate"
              :data-status="gate.status"
            >
              <span class="gate__name">{{ gate.gate }}</span>
              <span class="gate__status">{{ GATE_LABEL[gate.status] }}</span>
            </div>
          </div>
        </template>
      </section>
    </template>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.page-header h1 {
  margin: 0;
}

.page-header button,
.player__code button {
  font: inherit;
  font-size: 0.875rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 1.25rem;
}

.player {
  display: flex;
  gap: 1.25rem;
  /* Top-aligned rather than centred: the body grows tall once the nameplate
     banner is in it, and centring would push the portrait halfway down. */
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.player__avatar {
  border-radius: 10px;
  object-fit: cover;
}

.player__titles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0 0 0.5rem;
}

.player__title {
  font-size: 0.6875rem;
  padding: 0.1rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-muted);
}

.player__name {
  margin: 0;
  font-size: 1.375rem;
}

.player__team {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.player__banner {
  display: block;
  width: 100%;
  max-width: 26rem;
  height: auto;
  margin-top: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.player__code {
  margin: 0.75rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.stat {
  padding: 0.875rem 1rem;
}

.stat dt {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.stat dd {
  margin: 0.2rem 0 0;
  font-size: 1.125rem;
  font-variant-numeric: tabular-nums;
}

.rename-toggle {
  font: inherit;
  font-size: 0.6875rem;
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  vertical-align: middle;
}

.rename {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

.rename input {
  font: inherit;
  font-size: 0.9375rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  width: 10rem;
}

.rename button {
  font: inherit;
  font-size: 0.8125rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.rename small {
  flex-basis: 100%;
  font-size: 0.75rem;
  color: var(--color-muted);
}

.rename__error {
  color: var(--color-down);
}

.extras {
  margin-top: 1.5rem;
}

.extras__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.extras__header h2 {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  margin: 0;
}

.extras__header button {
  font: inherit;
  font-size: 0.8125rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.extras__error {
  color: var(--color-down);
  font-size: 0.875rem;
}

.extras__status,
.extras__streak {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.extras__streak {
  margin-top: 0.75rem;
}

.weekdays {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  padding: 0;
}

.weekdays li {
  flex: 1 1 5rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
}

.weekdays li.today {
  border-color: var(--color-accent);
}

.weekdays span {
  display: block;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.weekdays small {
  font-size: 0.75rem;
}

.gates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.gate {
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
}

.gate__name {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.gate__status {
  font-size: 0.6875rem;
  color: var(--color-muted);
}

.gate[data-status='clear'] {
  border-color: var(--color-up);
}

.gate[data-status='linkable'] {
  border-color: var(--color-accent);
}
</style>
