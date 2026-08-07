<script setup lang="ts">
import type {
  AnmitsuResult,
  BorderResult,
  CalculateResult,
} from '~~/shared/types/api'

useHead({ title: 'ChunithmQueue · Tools' })

const route = useRoute()
const api = useApi()

// --- Rating / OVER POWER -----------------------------------------------------

const score = ref(1_007_500)
const chartConst = ref(14.5)
const lamp = ref(0)
const calc = ref<CalculateResult | null>(null)
const calcError = ref<string | null>(null)

const runCalculate = async () => {
  calcError.value = null

  try {
    calc.value = await api<CalculateResult>('/tools/calculate', {
      query: { score: score.value, const: chartConst.value, lamp: lamp.value },
    })
  }
  catch (error) {
    calcError.value = readApiError(error)
  }
}

// --- Borders -----------------------------------------------------------------

const notecount = ref(Number(route.query.notecount) || 1000)
const border = ref<BorderResult | null>(null)
const borderError = ref<string | null>(null)

const runBorder = async () => {
  borderError.value = null

  try {
    border.value = await api<BorderResult>('/tools/border', {
      query: { notecount: notecount.value },
    })
  }
  catch (error) {
    borderError.value = readApiError(error)
  }
}

// --- Anmitsu -----------------------------------------------------------------

const bpm = ref(180)
const density = ref(16)
const anmitsu = ref<AnmitsuResult | null>(null)

const runAnmitsu = async () => {
  anmitsu.value = await api<AnmitsuResult>('/tools/anmitsu', {
    query: { bpm: bpm.value, density: density.value },
  })
}

const verdictLabel = (verdict: 'ideal' | 'risky' | 'no') =>
  verdict === 'ideal' ? 'Works' : verdict === 'risky' ? 'Risky' : 'No'

await Promise.all([runCalculate(), runBorder(), runAnmitsu()])
</script>

<template>
  <section>
    <h1>Tools</h1>
    <p class="lead">Calculators that need no account.</p>

    <!-- Rating and OVER POWER -->
    <article class="card">
      <h2>Rating &amp; OVER POWER</h2>

      <form class="fields" @submit.prevent="runCalculate">
        <label>
          Score
          <input v-model.number="score" type="number" min="0" max="1010000" step="1">
        </label>
        <label>
          Chart constant
          <input v-model.number="chartConst" type="number" min="1" max="16.5" step="0.1">
        </label>
        <label>
          Combo lamp
          <select v-model.number="lamp">
            <option :value="0">None</option>
            <option :value="1">FULL COMBO</option>
            <option :value="2">ALL JUSTICE</option>
            <option :value="3">AJC</option>
          </select>
        </label>
        <button type="submit">Calculate</button>
      </form>

      <p v-if="calcError" class="error">{{ calcError }}</p>

      <div v-else-if="calc" class="readout">
        <div><span>Rank</span><strong>{{ calc.rankName }}</strong></div>
        <div><span>Play rating</span><strong>{{ calc.rating.toFixed(2) }}</strong></div>
        <div>
          <span>OVER POWER</span>
          <strong>
            {{ calc.overpower.value.toFixed(3) }}
            <small>/ {{ calc.overpower.max }} ({{ calc.overpower.percentage.toFixed(2) }}%)</small>
          </strong>
        </div>
      </div>

      <p v-if="calc?.lampUpgrades.length" class="hint">
        With a better lamp:
        <span v-for="upgrade in calc.lampUpgrades" :key="upgrade.comboLamp">
          {{ comboLampLabel(upgrade.comboLamp) }}
          → {{ upgrade.overpower.value.toFixed(3) }}
        </span>
      </p>
    </article>

    <!-- Borders -->
    <article class="card">
      <h2>Score borders</h2>
      <p class="hint">
        How many mistakes a chart can absorb per rank. The split assumes a
        realistic run rather than an all-justice one, so treat it as guidance.
      </p>

      <form class="fields" @submit.prevent="runBorder">
        <label>
          Notecount
          <input v-model.number="notecount" type="number" min="1" step="1">
        </label>
        <button type="submit">Show borders</button>
      </form>

      <p v-if="borderError" class="error">{{ borderError }}</p>

      <div v-else-if="border" class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Rank</th><th>Min score</th>
              <th>CRITICAL</th><th>JUSTICE</th><th>ATTACK</th><th>MISS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in border.borders" :key="row.label">
              <td class="rank">{{ row.label }}</td>
              <td>{{ row.minScore.toLocaleString('en-US') }}</td>
              <td>{{ row.justiceCritical }}</td>
              <td>{{ row.justice }}</td>
              <td>{{ row.attack }}</td>
              <td>{{ row.miss }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="border" class="hint">
        Each JUSTICE costs {{ border.deduction.justice }} points, each ATTACK
        {{ border.deduction.attack }}, each MISS {{ border.deduction.miss }}.
      </p>
    </article>

    <!-- Anmitsu -->
    <article class="card">
      <h2>Anmitsu</h2>
      <p class="hint">
        Whether two consecutive notes are close enough to hit as one.
      </p>

      <form class="fields" @submit.prevent="runAnmitsu">
        <label>
          BPM
          <input v-model.number="bpm" type="number" min="1" step="0.1">
        </label>
        <label>
          Note density (1/n)
          <input v-model.number="density" type="number" min="1" max="1024" step="1">
        </label>
        <button type="submit">Check</button>
      </form>

      <div v-if="anmitsu" class="readout">
        <div><span>Gap</span><strong>{{ anmitsu.distanceMs }} ms</strong></div>
        <div>
          <span>JUSTICE CRITICAL overlap</span>
          <strong>{{ anmitsu.criticalOverlapMs }} ms</strong>
        </div>
        <div>
          <span>Rub the slider</span>
          <strong :data-verdict="anmitsu.rub">{{ verdictLabel(anmitsu.rub) }}</strong>
        </div>
        <div>
          <span>Anmitsu (different lanes)</span>
          <strong :data-verdict="anmitsu.anmitsu">{{ verdictLabel(anmitsu.anmitsu) }}</strong>
        </div>
      </div>
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
  margin: 0 0 0.5rem;
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
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.fields input,
.fields select {
  font: inherit;
  font-size: 0.9375rem;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-text);
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  min-width: 8rem;
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

.readout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
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

.readout small {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-muted);
}

[data-verdict='ideal'] { color: var(--color-up); }
[data-verdict='no'] { color: var(--color-down); }

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

th, td {
  padding: 0.35rem 0.6rem;
  text-align: right;
  border-bottom: 1px solid var(--color-border);
}

th:first-child, td:first-child {
  text-align: left;
}

th {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.rank {
  font-weight: 650;
}

.hint {
  margin: 0.75rem 0 0;
  font-size: 0.75rem;
  color: var(--color-muted);
}

.hint span::after {
  content: ' · ';
}

.hint span:last-child::after {
  content: '';
}

.error {
  color: var(--color-down);
  font-size: 0.875rem;
}
</style>
