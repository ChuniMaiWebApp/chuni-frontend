<script setup lang="ts">
import type {
  ReachResult,
  RecommendResult,
  WhatIfResult,
} from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmQueue · Improve' })

const api = useApi()

/**
 * Every call here fetches the rating breakdown from CHUNITHM-NET, so nothing
 * runs until asked for — three panels loading on mount would be three trips to
 * SEGA for a page the player might only skim.
 */

// --- What if ----------------------------------------------------------------

const playRating = ref(16.5)
const replacing = ref<number | null>(null)
const whatIf = ref<WhatIfResult | null>(null)
const whatIfBusy = ref(false)
const whatIfError = ref<string | null>(null)

const runWhatIf = async () => {
  whatIfBusy.value = true
  whatIfError.value = null

  try {
    whatIf.value = await api<WhatIfResult>('/chunithm/what-if', {
      query: {
        playRating: playRating.value,
        replacing: replacing.value ?? undefined,
      },
    })
  }
  catch (error) {
    whatIfError.value = readApiError(error)
  }
  finally {
    whatIfBusy.value = false
  }
}

// --- Reach ------------------------------------------------------------------

const target = ref(17)
const reach = ref<ReachResult | null>(null)
const reachBusy = ref(false)
const reachError = ref<string | null>(null)

const runReach = async () => {
  reachBusy.value = true
  reachError.value = null

  try {
    reach.value = await api<ReachResult>('/chunithm/improve/reach', {
      query: { target: target.value },
    })
  }
  catch (error) {
    reachError.value = readApiError(error)
  }
  finally {
    reachBusy.value = false
  }
}

// --- Recommend ---------------------------------------------------------------

const count = ref(3)
const recommend = ref<RecommendResult | null>(null)
const recommendBusy = ref(false)
const recommendError = ref<string | null>(null)

const runRecommend = async () => {
  recommendBusy.value = true
  recommendError.value = null

  try {
    recommend.value = await api<RecommendResult>('/chunithm/improve/recommend', {
      query: { count: count.value },
    })
  }
  catch (error) {
    recommendError.value = readApiError(error)
  }
  finally {
    recommendBusy.value = false
  }
}
</script>

<template>
  <section>
    <h1>Improve</h1>
    <p class="lead">
      Each panel reads your current rating breakdown from CHUNITHM-NET, so they
      load on demand rather than all at once.
    </p>

    <!-- What if -->
    <article class="card">
      <h2>What if I score…</h2>
      <p class="hint">
        Enter the play rating a new score would be worth. If you already have a
        score on that chart, enter its current play rating too — without it the
        gain is overstated, because one chart cannot hold two rating slots.
      </p>

      <form class="fields" @submit.prevent="runWhatIf">
        <label>
          New play rating
          <input v-model.number="playRating" type="number" min="0" max="20" step="0.01">
        </label>
        <label>
          Replacing (optional)
          <input v-model.number="replacing" type="number" min="0" max="20" step="0.01">
        </label>
        <button type="submit" :disabled="whatIfBusy">
          {{ whatIfBusy ? 'Checking…' : 'Check' }}
        </button>
      </form>

      <p v-if="whatIfError" class="error">{{ whatIfError }}</p>

      <div v-else-if="whatIf" class="readout">
        <div>
          <span>Rating now</span><strong>{{ whatIf.currentRating.toFixed(2) }}</strong>
        </div>
        <div>
          <span>After</span>
          <strong :data-good="whatIf.counts">{{ whatIf.newRating.toFixed(2) }}</strong>
        </div>
        <div>
          <span>Gain</span><strong>+{{ whatIf.delta.toFixed(4) }}</strong>
        </div>
        <div v-if="whatIf.displaces !== null">
          <span>{{ whatIf.counts ? 'Pushes out' : 'Must beat' }}</span>
          <strong>{{ whatIf.displaces.toFixed(2) }}</strong>
        </div>
      </div>

      <p v-if="whatIf && !whatIf.counts" class="hint">
        That score would not count — it does not beat the weakest play already
        in your rating.
      </p>
    </article>

    <!-- Reach -->
    <article class="card">
      <h2>Reach a target rating</h2>
      <p class="hint">
        Shows the play rating <em>every</em> counted slot would need. That is a
        ceiling rather than a plan, but it answers whether a target is close.
      </p>

      <form class="fields" @submit.prevent="runReach">
        <label>
          Target rating
          <input v-model.number="target" type="number" min="0" max="20" step="0.01">
        </label>
        <button type="submit" :disabled="reachBusy">
          {{ reachBusy ? 'Working…' : 'Show' }}
        </button>
      </form>

      <p v-if="reachError" class="error">{{ reachError }}</p>

      <template v-else-if="reach">
        <p v-if="reach.alreadyReached" class="hint">
          Already there — your rating is {{ reach.currentRating.toFixed(2) }}.
        </p>

        <div v-else class="readout">
          <div>
            <span>Rating now</span><strong>{{ reach.currentRating.toFixed(2) }}</strong>
          </div>
          <div><span>Target</span><strong>{{ reach.target.toFixed(2) }}</strong></div>
          <div>
            <span>Every slot needs</span>
            <strong>{{ reach.requiredPlayRating?.toFixed(2) }}</strong>
          </div>
          <div v-if="reach.floors.best !== null">
            <span>Best 30 floor</span>
            <strong>{{ reach.floors.best.toFixed(2) }}</strong>
          </div>
        </div>
      </template>
    </article>

    <!-- Recommend -->
    <article class="card">
      <h2>What should I play next</h2>
      <p class="hint">
        Charts around your rating floor, with the score each one needs to start
        counting. Anything below the floor cannot raise your rating however well
        it is played.
      </p>

      <form class="fields" @submit.prevent="runRecommend">
        <label>
          How many
          <input v-model.number="count" type="number" min="1" max="10" step="1">
        </label>
        <button type="submit" :disabled="recommendBusy">
          {{ recommendBusy ? 'Picking…' : 'Suggest charts' }}
        </button>
      </form>

      <p v-if="recommendError" class="error">{{ recommendError }}</p>

      <template v-else-if="recommend">
        <p class="hint">
          Rating floor {{ recommend.ratingFloor.toFixed(2) }} — a play must beat
          that to count.
        </p>

        <ul class="suggestions">
          <li
            v-for="entry in recommend.recommendations"
            :key="`${entry.song.id}-${entry.difficultyName}`"
            :style="{ '--difficulty': difficultyColour(entry.difficulty) }"
          >
            <img
              v-if="entry.song.jacketUrl"
              :src="entry.song.jacketUrl"
              alt=""
              width="48"
              height="48"
              loading="lazy"
            >
            <div class="suggestion__body">
              <NuxtLink :to="`/songs/${entry.song.id}`">{{ entry.song.title }}</NuxtLink>
              <p class="suggestion__chart">
                {{ entry.difficultyName }} {{ entry.const }}
              </p>
            </div>
            <div class="suggestion__target">
              <span>Score needed</span>
              <strong>{{ entry.requiredScore.toLocaleString('en-US') }}</strong>
            </div>
          </li>
        </ul>
      </template>
    </article>
  </section>
</template>

<style scoped>
.lead {
  color: var(--color-muted);
  margin-bottom: 1.5rem;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.card h2 {
  font-size: 1rem;
  margin: 0 0 0.4rem;
}

.fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  margin: 0.875rem 0;
}

.fields label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.fields input {
  font: inherit;
  font-size: 0.9375rem;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-text);
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  min-width: 9rem;
}

.fields button {
  font: inherit;
  font-weight: 600;
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 8px;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
}

.fields button:disabled {
  opacity: 0.6;
  cursor: progress;
}

.readout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.readout div {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.readout span {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.readout strong {
  font-size: 1.125rem;
  font-variant-numeric: tabular-nums;
}

.readout [data-good='true'] {
  color: var(--color-up);
}

.suggestions {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestions li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--difficulty);
  border-radius: 8px;
  background: var(--color-bg);
}

.suggestions img {
  border-radius: 6px;
  object-fit: cover;
}

.suggestion__body {
  flex: 1;
  min-width: 0;
}

.suggestion__body a {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 550;
}

.suggestion__chart {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  color: var(--difficulty);
  font-weight: 600;
}

.suggestion__target {
  text-align: right;
}

.suggestion__target span {
  display: block;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.suggestion__target strong {
  font-variant-numeric: tabular-nums;
}

.hint {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-muted);
}

.error {
  color: var(--color-down);
  font-size: 0.875rem;
}
</style>
