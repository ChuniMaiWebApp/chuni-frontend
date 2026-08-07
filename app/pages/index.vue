<script setup lang="ts">
import type { HealthResponse } from '~~/shared/types/api'

useHead({ title: 'ChunithmQueue' })

const { user, refresh: refreshUser } = useAuth()

await refreshUser()

const { data: health } = await useApiFetch<HealthResponse>('/health')

const ALL_PAGES = [
  { to: '/profile', title: 'Profile', description: 'Rating, OVER POWER, level and play count.', needsAccount: true },
  { to: '/recent', title: 'Recent plays', description: 'Your last 50 tracks, with judgements on demand.', needsAccount: true },
  { to: '/best50', title: 'Rating breakdown', description: 'Best 30 plus New 20, the way the game counts it.', needsAccount: true },
  { to: '/top', title: 'Top scores', description: 'Filter and sort every personal best you have.', needsAccount: true },
  { to: '/statistics', title: 'Statistics', description: 'Folder coverage, rank and lamp tallies, OVER POWER.', needsAccount: true },
  { to: '/improve', title: 'Improve', description: 'What a score would be worth, and what to play next.', needsAccount: true },
  { to: '/songs', title: 'Songs', description: 'Search charts, constants, notecounts and chart views.', needsAccount: false },
  { to: '/tools', title: 'Tools', description: 'Rating, OVER POWER, score borders and anmitsu.', needsAccount: false },
]

// Signed out, only link what actually works without an account.
const pages = computed(() =>
  ALL_PAGES.filter((page) => user.value || !page.needsAccount),
)
</script>

<template>
  <section>
    <h1>ChunithmQueue</h1>

    <p v-if="user" class="lead">
      Signed in as <strong>{{ user.displayName }}</strong>.
    </p>
    <p v-else class="lead">
      Queue tracking for CHUNITHM in Vietnam. Link your CHUNITHM-NET account to
      see your scores here.
    </p>

    <NuxtLink v-if="!user" to="/login" class="cta">Link my account</NuxtLink>

    <div class="grid">
      <NuxtLink v-for="page in pages" :key="page.to" :to="page.to" class="tile">
        <h2>{{ page.title }}</h2>
        <p>{{ page.description }}</p>
      </NuxtLink>
    </div>

    <details class="status">
      <summary>System status</summary>
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
.lead {
  color: var(--color-muted);
  max-width: 44rem;
  margin-bottom: 1.5rem;
}

.cta {
  display: inline-block;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  background: var(--color-accent);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.tile {
  display: block;
  padding: 1.125rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: inherit;
  text-decoration: none;
}

.tile:hover {
  border-color: var(--color-accent);
}

.tile h2 {
  font-size: 1rem;
  margin: 0 0 0.25rem;
}

.tile p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.status {
  margin-top: 2rem;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}
</style>
