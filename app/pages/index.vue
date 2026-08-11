<script setup lang="ts">
import type { HealthResponse, Statistics } from '~~/shared/types/api'

useHead({ title: 'ChunithmWebApp — Home' })

const { user, refresh: refreshUser } = useAuth()

await refreshUser()

const { data: health } = await useApiFetch<HealthResponse>('/health')

/**
 * The signed-in summary, read entirely from the local cache.
 *
 * Deliberately no CHUNITHM-NET call. Home is the page opened most often, every
 * live figure on it would be a request to SEGA against a rate limit shared by
 * the whole instance, and a roomful of players opening the app at once is the
 * normal case rather than the edge one. A stale number that says how stale it
 * is beats a fresh number nobody else can fetch.
 */
const { data: stats } = await useApiFetch<Statistics>('/records/statistics', {
  immediate: Boolean(user.value),
})

/** How long ago the cache was filled, in words. */
const syncedAgo = computed(() => {
  const finished = stats.value?.sync?.finishedAt

  if (!finished) return null

  const hours = (Date.now() - new Date(finished).getTime()) / 3_600_000

  if (hours < 1) return 'just now'
  if (hours < 24) return `${Math.floor(hours)}h ago`

  const days = Math.floor(hours / 24)

  return `${days} day${days === 1 ? '' : 's'} ago`
})

/** Past this the numbers below are old enough to mention it. */
const syncIsStale = computed(() => {
  const finished = stats.value?.sync?.finishedAt

  if (!finished) return false

  return Date.now() - new Date(finished).getTime() > 7 * 86_400_000
})

const ALL_PAGES = [
  { to: '/recent', icon: 'history', title: 'Recent plays', description: 'Your last 50 tracks with detailed judgement breakdown.', needsAccount: true, primary: true },
  { to: '/best50', icon: 'trophy', title: 'Best 50', description: 'Best 30 plus New 20 official rating breakdown.', needsAccount: true, primary: true },
  { to: '/profile', icon: 'user', title: 'Profile & Verse', description: 'Player card, nameplate, login bonuses, and 10 Linked VERSE gates.', needsAccount: true, primary: true },
  { to: '/top', icon: 'layers', title: 'All Personal Bests', description: 'Filter and search every cached chart record.', needsAccount: true },
  { to: '/statistics', icon: 'chart', title: 'Statistics', description: 'Folder completion, rank/lamp distribution counts, and OP metrics.', needsAccount: true },
  { to: '/improve', icon: 'trending', title: 'Improvement', description: 'Rating target recommendation engine & play suggestions.', needsAccount: true },
  { to: '/songs', icon: 'music', title: 'Song Database', description: 'Search charts, constants, notecounts, and chart data.', needsAccount: false },
  { to: '/tools', icon: 'sliders', title: 'Tools & Calculators', description: 'Rating, OVER POWER, score borders, and anmitsu calculators.', needsAccount: false },
  { to: '/support', icon: 'heart', title: 'Support Project', description: 'Contribute on GitHub or donate to support server infrastructure.', needsAccount: false },
]

const pages = computed(() =>
  ALL_PAGES.filter((page) => user.value || !page.needsAccount),
)
</script>

<template>
  <section class="dashboard">
    <!-- Logged in Dashboard Banner -->
    <div v-if="user" class="dashboard__hero">
      <div class="dashboard__hero-body">
        <div class="dashboard__user-badge">
          <span class="online-pulse" /> SEGA ID Linked
        </div>
        <h1 class="dashboard__welcome">{{ user.displayName }}</h1>

        <!-- Everything here is the local cache, so it is dated rather than
             presented as live. -->
        <dl v-if="stats?.sync?.hasSynced" class="summary">
          <div class="summary__item">
            <dt>Charts played</dt>
            <dd>
              {{ stats.coverage.played.toLocaleString('en-GB') }}
              <small>of {{ stats.coverage.total.toLocaleString('en-GB') }} · {{ stats.coverage.percentage }}%</small>
            </dd>
          </div>
          <div class="summary__item">
            <dt>OVER POWER</dt>
            <dd>
              {{ stats.overpower.value.toLocaleString('en-GB') }}
              <small>{{ stats.overpower.percentage }}%</small>
            </dd>
          </div>
          <div class="summary__item">
            <dt>Best score</dt>
            <dd v-if="stats.best">
              {{ formatScore(stats.best.score) }}
              <small>{{ stats.best.song.title }}</small>
            </dd>
            <dd v-else>—</dd>
          </div>
          <div class="summary__item">
            <dt>Cache synced</dt>
            <dd :class="{ 'summary--stale': syncIsStale }">
              {{ syncedAgo ?? 'never' }}
              <small v-if="syncIsStale">Numbers above are that old</small>
            </dd>
          </div>
        </dl>

        <p v-else class="dashboard__subtitle">
          Nothing cached yet. Run a
          <NuxtLink to="/statistics">sync</NuxtLink> to pull your records from
          CHUNITHM-NET, then this page can summarise them without asking SEGA
          again.
        </p>

        <div class="dashboard__actions">
          <NuxtLink to="/recent" class="btn btn--primary">
            <AppIcon name="history" /> Recent plays
          </NuxtLink>
          <NuxtLink to="/best50" class="btn btn--secondary">
            <AppIcon name="trophy" /> Best 50
          </NuxtLink>
          <NuxtLink to="/profile" class="btn btn--outline">
            <AppIcon name="user" /> Player card
          </NuxtLink>
        </div>
      </div>

      <!-- Queue Status Widget Placeholder -->
      <div class="queue-card">
        <div class="queue-card__header">
          <span class="queue-card__icon"><AppIcon name="pin" :size="22" /></span>
          <div>
            <h3 class="queue-card__title">Arcade Queue</h3>
            <span class="queue-card__subtitle">Store Queue System</span>
          </div>
          <span class="queue-card__badge">Coming Soon</span>
        </div>
        <p class="queue-card__desc">
          Check real-time machine queue status at local Vietnamese arcades, join line, and track estimated wait times.
        </p>
      </div>
    </div>

    <!-- Logged out Hero Banner -->
    <div v-else class="hero-guest">
      <!-- <div class="hero-guest__badge">ChunithmWebApp</div> -->
      <h1 class="hero-guest__title">Chunithm<span class="text-accent">Web App</span></h1>
      <p class="hero-guest__lead">
        Track your play history, calculate rating targets, analyze judgement accuracy, and join arcade queues right from your phone.
      </p>
      <div class="hero-guest__actions">
        <NuxtLink to="/login" class="btn btn--primary btn--lg">
          <AppIcon name="key" /> Link SEGA ID Account
        </NuxtLink>
        <NuxtLink to="/songs" class="btn btn--secondary btn--lg">
          <AppIcon name="music" /> Explore Songs
        </NuxtLink>
      </div>
    </div>

    <!--
      Eight descriptive tiles repeated the navigation bar word for word and
      pushed everything else below the fold. The three destinations that matter
      are buttons above; the rest is a list.
    -->
    <div class="section-header">
      <h2>Everything else</h2>
    </div>

    <div class="links">
      <NuxtLink
        v-for="page in pages"
        :key="page.to"
        :to="page.to"
        class="link-chip"
      >
        <AppIcon :name="page.icon" :size="15" />
        {{ page.title }}
      </NuxtLink>
    </div>

    <!-- System Status Collapsible -->
    <details class="status">
      <summary class="status__summary">
        <span>System & API Services</span>
      </summary>
      <div class="status-grid">
        <StatusCard
          v-for="(status, name) in health?.dependencies ?? {}"
          :key="name"
          :label="String(name)"
          :status="status"
        />
      </div>
    </details>
  </section>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.75rem 1.25rem;
  margin: 0.75rem 0 0;
}

.summary__item dt {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.summary__item dd {
  margin: 0.15rem 0 0;
  font-size: 1.0625rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.summary__item dd small {
  display: block;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* A week-old cache is worth flagging, not hiding. */
.summary--stale {
  color: var(--rating-orange);
}

.summary--stale small {
  color: var(--rating-orange);
  opacity: 0.85;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.link-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.8125rem;
  text-decoration: none;
}

.link-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard__hero {
  display: grid;
  grid-template-columns: 1fr 18rem;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.dashboard__user-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 650;
  color: var(--color-accent);
  margin-bottom: 0.5rem;
}

.online-pulse {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 6px var(--color-accent);
}

.dashboard__welcome {
  font-size: 1.625rem;
  font-weight: 800;
  margin-bottom: 0.35rem;
}

.dashboard__subtitle {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

/*
 * The summary above ends in a value, not a heading, so without its own space
 * "1 day ago" sat directly on top of the buttons and read as their label.
 */
.dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin-top: 1.25rem;
}

/* Queue Card */
/*
 * The chip tokens are for game colours that need a dark backing whatever the
 * theme. A whole panel using them stayed black on a light page — this is app
 * chrome, so it follows the theme like the rest.
 */
.queue-card {
  padding: 1.125rem;
  border-radius: var(--radius);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.queue-card__header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.625rem;
}

.queue-card__icon {
  font-size: 1.375rem;
}

.queue-card__title {
  font-size: 0.9375rem;
  font-weight: 750;
  margin: 0;
}

.queue-card__subtitle {
  font-size: 0.6875rem;
  color: #9ca3af;
}

.queue-card__badge {
  margin-left: auto;
  font-size: 0.625rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  text-transform: uppercase;
}

.queue-card__desc {
  font-size: 0.75rem;
  line-height: 1.4;
  color: #9ca3af;
  margin: 0;
}

/* Guest Hero */
.hero-guest {
  text-align: center;
  padding: 2.5rem 1.5rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.hero-guest__badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  margin-bottom: 0.875rem;
}

.hero-guest__title {
  font-size: 2.25rem;
  font-weight: 850;
  margin-bottom: 0.5rem;
}

.text-accent {
  color: var(--color-accent);
}

.hero-guest__lead {
  color: var(--color-muted);
  max-width: 36rem;
  margin: 0 auto 1.5rem;
  font-size: 0.9375rem;
}

.hero-guest__actions {
  display: flex;
  justify-content: center;
  gap: 0.875rem;
  flex-wrap: wrap;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}

.btn--primary:hover {
  background: var(--color-accent-hover);
}

.btn--secondary {
  background: var(--color-surface-hover);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover {
  border-color: var(--color-accent);
}

.btn--outline {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--outline:hover {
  border-color: var(--color-muted);
}

.btn--lg {
  padding: 0.7rem 1.35rem;
  font-size: 0.9375rem;
}

/* Navigation Section */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 750;
  margin: 0;
}

.section-subtitle {
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14.5rem, 1fr));
  gap: 0.875rem;
}

.tile {
  display: flex;
  flex-direction: column;
  padding: 1.125rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: inherit;
  text-decoration: none;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.tile:hover {
  border-color: var(--color-accent);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.tile--primary {
  border-color: color-mix(in srgb, var(--color-accent) 40%, var(--color-border) 60%);
}

.tile__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
  color: var(--color-text);
}

.tile__desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-muted);
  line-height: 1.4;
}

/* Status Section */
.status {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.status__summary {
  font-weight: 650;
  font-size: 0.875rem;
  color: var(--color-muted);
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.status__summary:hover {
  color: var(--color-text);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (max-width: 52rem) {
  .dashboard__hero {
    grid-template-columns: 1fr;
  }
}
</style>

