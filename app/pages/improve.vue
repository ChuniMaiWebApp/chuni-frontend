<script setup lang="ts">
import type {
  ReachResult,
  RecommendResult,
  WhatIfResult,
} from '~~/shared/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ChunithmWebApp · Improvement Targets' })

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
  <section class="improve-page">
    <header class="page-header">
      <div>
        <h1>Rating Improvement Engine</h1>
        <p class="lead">
          Calculate score rating gains, test target ceilings, and generate chart play recommendations.
        </p>
      </div>
    </header>

    <!-- What if -->
    <article class="card">
      <h2 class="card__title"><AppIcon name="bolt" /> What if I score…</h2>
      <p class="hint">
        Enter the play rating a new score would be worth. If you already have a
        score on that chart, enter its current play rating too — without it the
        gain is overstated, because one chart cannot hold two rating slots.
      </p>

      <form class="fields" @submit.prevent="runWhatIf">
        <label class="field-item">
          <span>New play rating</span>
          <input v-model.number="playRating" type="number" min="0" max="20" step="0.01">
        </label>
        <label class="field-item">
          <span>Replacing (optional)</span>
          <input v-model.number="replacing" type="number" min="0" max="20" step="0.01">
        </label>
        <button type="submit" class="btn btn--primary" :disabled="whatIfBusy">
          {{ whatIfBusy ? 'Checking…' : 'Calculate Gain' }}
        </button>
      </form>

      <p v-if="whatIfError" class="error">{{ whatIfError }}</p>

      <div v-else-if="whatIf" class="readout">
        <div class="readout__item">
          <span class="readout__label">Rating now</span>
          <strong class="readout__val tabular">{{ whatIf.currentRating.toFixed(2) }}</strong>
        </div>
        <div class="readout__item">
          <span class="readout__label">Rating After</span>
          <strong class="readout__val tabular" :data-good="whatIf.counts">{{ whatIf.newRating.toFixed(2) }}</strong>
        </div>
        <div class="readout__item">
          <span class="readout__label">Net Gain</span>
          <strong class="readout__val readout__val--gain tabular">+{{ whatIf.delta.toFixed(4) }}</strong>
        </div>
        <div v-if="whatIf.displaces !== null" class="readout__item">
          <span class="readout__label">{{ whatIf.counts ? 'Pushes out' : 'Must beat' }}</span>
          <strong class="readout__val tabular">{{ whatIf.displaces.toFixed(2) }}</strong>
        </div>
      </div>

      <p v-if="whatIf && !whatIf.counts" class="hint hint--warning">
        <AppIcon name="warning" /> That score would not count — it does not beat the weakest play already in your rating.
      </p>
    </article>

    <!-- Reach -->
    <article class="card">
      <h2 class="card__title"><AppIcon name="target" /> Reach a target rating</h2>
      <p class="hint">
        Shows the play rating <em>every</em> counted slot would need. That is a
        ceiling rather than a plan, but it answers whether a target is close.
      </p>

      <form class="fields" @submit.prevent="runReach">
        <label class="field-item">
          <span>Target rating</span>
          <input v-model.number="target" type="number" min="0" max="20" step="0.01">
        </label>
        <button type="submit" class="btn btn--primary" :disabled="reachBusy">
          {{ reachBusy ? 'Working…' : 'Calculate Required Floor' }}
        </button>
      </form>

      <p v-if="reachError" class="error">{{ reachError }}</p>

      <template v-else-if="reach">
        <p v-if="reach.alreadyReached" class="hint hint--success">
          Already reached — your current rating is {{ reach.currentRating.toFixed(2) }}.
        </p>

        <div v-else class="readout">
          <div class="readout__item">
            <span class="readout__label">Rating now</span>
            <strong class="readout__val tabular">{{ reach.currentRating.toFixed(2) }}</strong>
          </div>
          <div class="readout__item">
            <span class="readout__label">Target</span>
            <strong class="readout__val tabular">{{ reach.target.toFixed(2) }}</strong>
          </div>
          <div class="readout__item">
            <span class="readout__label">Every slot needs</span>
            <strong class="readout__val readout__val--gain tabular">{{ reach.requiredPlayRating?.toFixed(2) }}</strong>
          </div>
          <div v-if="reach.floors.best !== null" class="readout__item">
            <span class="readout__label">Best 30 floor</span>
            <strong class="readout__val tabular">{{ reach.floors.best.toFixed(2) }}</strong>
          </div>
        </div>
      </template>
    </article>

    <!-- Recommend -->
    <article class="card">
      <h2 class="card__title"><AppIcon name="music" /> What should I play next?</h2>
      <p class="hint">
        Suggests charts around your rating floor with the exact score required to start counting toward your total rating.
      </p>

      <form class="fields" @submit.prevent="runRecommend">
        <label class="field-item">
          <span>Number of suggestions</span>
          <input v-model.number="count" type="number" min="1" max="10" step="1">
        </label>
        <button type="submit" class="btn btn--primary" :disabled="recommendBusy">
          {{ recommendBusy ? 'Picking…' : 'Suggest charts' }}
        </button>
      </form>

      <p v-if="recommendError" class="error">{{ recommendError }}</p>

      <template v-else-if="recommend">
        <p class="hint">
          Rating floor: <strong>{{ recommend.ratingFloor.toFixed(2) }}</strong> — a new play must beat this play rating to count.
        </p>

        <ul class="suggestions">
          <li
            v-for="entry in recommend.recommendations"
            :key="`${entry.song.id}-${entry.difficultyName}`"
            class="suggestion-item"
            :style="{ '--difficulty': difficultyInk(entry.difficulty) }"
          >
            <img
              v-if="entry.song.jacketUrl"
              :src="entry.song.jacketUrl"
              alt=""
              width="52"
              height="52"
              loading="lazy"
              class="suggestion__jacket"
            >
            <div v-else class="suggestion__jacket-placeholder" />

            <div class="suggestion__body">
              <NuxtLink :to="`/songs/${entry.song.id}`" class="suggestion__title">
                {{ entry.song.title }}
              </NuxtLink>
              <p class="suggestion__chart">
                {{ entry.difficultyName }} {{ entry.const }}
              </p>
            </div>

            <div class="suggestion__target">
              <span class="suggestion__target-label">Score needed</span>
              <strong class="suggestion__target-val tabular">{{ entry.requiredScore.toLocaleString('en-US') }}</strong>
            </div>
          </li>
        </ul>
      </template>
    </article>
  </section>
</template>

<style scoped>
.improve-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
}

.lead {
  color: var(--color-muted);
  font-size: 0.84375rem;
  margin: 0;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  padding: 1.25rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.card__title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.125rem;
  font-weight: 750;
  margin: 0 0 0.4rem;
  color: var(--color-text);
}

.fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.875rem;
  margin: 1rem 0;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  flex: 1 1 10rem;
}

.field-item input {
  font: inherit;
  font-size: 0.9375rem;
  color: var(--color-text);
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  width: 100%;
}

.readout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.75rem;
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.readout__item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.readout__label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.readout__val {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
}

.readout__val--gain {
  color: var(--color-accent);
}

.readout [data-good='true'] {
  color: var(--color-up);
}

.suggestions {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--difficulty);
  border-radius: var(--radius);
  background: var(--color-bg);
}

.suggestion__jacket,
.suggestion__jacket-placeholder {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.suggestion__jacket-placeholder {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.suggestion__body {
  flex: 1;
  min-width: 0;
}

.suggestion__title {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9375rem;
}

.suggestion__title:hover {
  color: var(--color-accent);
}

.suggestion__chart {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: var(--difficulty);
  font-weight: 700;
}

.suggestion__target {
  text-align: right;
}

.suggestion__target-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.suggestion__target-val {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
}

.hint {
  margin: 0.5rem 0 0;
  font-size: 0.78125rem;
  line-height: 1.4;
  color: var(--color-muted);
}

.hint--warning { color: var(--rating-orange); }
.hint--success { color: var(--color-up); font-weight: 600; }

.error {
  color: var(--color-down);
  font-weight: 600;
  font-size: 0.875rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 650;
  cursor: pointer;
  border: none;
}

.btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}
</style>

