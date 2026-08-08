<script setup lang="ts">
import type {
  AnmitsuResult,
  BorderResult,
  CalculateResult,
} from '~~/shared/types/api'

useHead({ title: 'ChunithmQueue · Arcade Utilities & Calculators' })

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
  <section class="tools-page">
    <header class="page-header">
      <div>
        <h1>Arcade Utilities &amp; Calculators</h1>
        <p class="lead">Standalone rhythm game tools — no account required.</p>
      </div>
    </header>

    <!-- Rating and OVER POWER -->
    <article class="card">
      <h2 class="card__title"><AppIcon name="target" /> Rating &amp; OVER POWER Calculator</h2>

      <form class="fields" @submit.prevent="runCalculate">
        <label class="field-item">
          <span>Score</span>
          <input v-model.number="score" type="number" min="0" max="1010000" step="1">
        </label>
        <label class="field-item">
          <span>Chart constant</span>
          <input v-model.number="chartConst" type="number" min="1" max="16.5" step="0.1">
        </label>
        <label class="field-item">
          <span>Combo lamp</span>
          <select v-model.number="lamp">
            <option :value="0">None</option>
            <option :value="1">FULL COMBO</option>
            <option :value="2">ALL JUSTICE</option>
            <option :value="3">AJC</option>
          </select>
        </label>
        <button type="submit" class="btn btn--primary">Calculate</button>
      </form>

      <p v-if="calcError" class="error">{{ calcError }}</p>

      <div v-else-if="calc" class="readout">
        <div class="readout__item">
          <span class="readout__label">Rank</span>
          <strong class="readout__val">{{ calc.rankName }}</strong>
        </div>
        <div class="readout__item">
          <span class="readout__label">Play rating</span>
          <strong class="readout__val tabular">{{ calc.rating.toFixed(2) }}</strong>
        </div>
        <div class="readout__item">
          <span class="readout__label">OVER POWER</span>
          <strong class="readout__val tabular">
            {{ calc.overpower.value.toFixed(3) }}
            <small>/ {{ calc.overpower.max }} ({{ calc.overpower.percentage.toFixed(2) }}%)</small>
          </strong>
        </div>
      </div>

      <p v-if="calc?.lampUpgrades.length" class="hint">
        With a better lamp:
        <span
          v-for="upgrade in calc.lampUpgrades"
          :key="upgrade.comboLamp"
          class="upgrade"
        >
          <span class="upgrade__lamp">{{ comboLampLabel(upgrade.comboLamp) }}</span>
          <span class="upgrade__value tabular">{{ upgrade.overpower.value.toFixed(3) }}</span>
        </span>
      </p>
    </article>

    <!-- Borders -->
    <article class="card">
      <h2 class="card__title"><AppIcon name="chart" /> Score Borders &amp; Mistake Absorption</h2>
      <p class="hint">
        How many mistakes a chart can absorb per rank threshold.
      </p>

      <form class="fields" @submit.prevent="runBorder">
        <label class="field-item">
          <span>Total Chart Notecount</span>
          <input v-model.number="notecount" type="number" min="1" step="1">
        </label>
        <button type="submit" class="btn btn--primary">Show Borders</button>
      </form>

      <p v-if="borderError" class="error">{{ borderError }}</p>

      <div v-else-if="border" class="table-scroll">
        <table class="border-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Min score</th>
              <th>CRITICAL</th>
              <th>JUSTICE</th>
              <th>ATTACK</th>
              <th>MISS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in border.borders" :key="row.label">
              <td class="rank">{{ row.label }}</td>
              <td class="tabular">{{ row.minScore.toLocaleString('en-US') }}</td>
              <td class="tabular">{{ row.justiceCritical }}</td>
              <td class="tabular">{{ row.justice }}</td>
              <td class="tabular">{{ row.attack }}</td>
              <td class="tabular">{{ row.miss }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="border" class="hint">
        Each JUSTICE costs <strong>{{ border.deduction.justice }}</strong> pts, ATTACK <strong>{{ border.deduction.attack }}</strong> pts, MISS <strong>{{ border.deduction.miss }}</strong> pts.
      </p>
    </article>

    <!-- Anmitsu -->
    <article class="card">
      <h2 class="card__title"><AppIcon name="sliders" /> Anmitsu &amp; slider rubbing tolerances</h2>
      <p class="hint">
        Determine if fast consecutive notes overlap within the Justice Critical window to hit simultaneously.
      </p>

      <form class="fields" @submit.prevent="runAnmitsu">
        <label class="field-item">
          <span>BPM</span>
          <input v-model.number="bpm" type="number" min="1" step="0.1">
        </label>
        <label class="field-item">
          <span>Note density (1/n)</span>
          <input v-model.number="density" type="number" min="1" max="1024" step="1">
        </label>
        <button type="submit" class="btn btn--primary">Check Tolerance</button>
      </form>

      <div v-if="anmitsu" class="readout">
        <div class="readout__item">
          <span class="readout__label">Note Gap</span>
          <strong class="readout__val tabular">{{ anmitsu.distanceMs }} ms</strong>
        </div>
        <div class="readout__item">
          <span class="readout__label">CRITICAL Overlap</span>
          <strong class="readout__val tabular">{{ anmitsu.criticalOverlapMs }} ms</strong>
        </div>
        <div class="readout__item">
          <span class="readout__label">Rub the Slider</span>
          <strong class="readout__val" :data-verdict="anmitsu.rub">{{ verdictLabel(anmitsu.rub) }}</strong>
        </div>
        <div class="readout__item">
          <span class="readout__label">Anmitsu (Diff Lanes)</span>
          <strong class="readout__val" :data-verdict="anmitsu.anmitsu">{{ verdictLabel(anmitsu.anmitsu) }}</strong>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
/* Without a separator these ran together as "83.000ALL JUSTICE". Each upgrade
   is its own chip so the boundary is structural rather than a space. */
.upgrade {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  margin-right: 0.5rem;
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.75rem;
}

.upgrade__lamp {
  color: var(--color-muted);
}

.upgrade__value {
  font-weight: 650;
}

.tools-page {
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
  flex: 1 1 9rem;
}

.field-item input,
.field-item select {
  font: inherit;
  font-size: 0.875rem;
  color: var(--color-text);
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  width: 100%;
}

.readout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
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

.readout__val small {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
}

[data-verdict='ideal'] { color: var(--color-up); }
[data-verdict='no'] { color: var(--color-down); }

.table-scroll {
  overflow-x: auto;
  margin-top: 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.border-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th, td {
  padding: 0.5rem 0.75rem;
  text-align: right;
  border-bottom: 1px solid var(--color-border);
}

th:first-child, td:first-child {
  text-align: left;
}

th {
  font-size: 0.6875rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  background: var(--color-bg);
}

.rank {
  font-weight: 800;
  color: var(--color-text);
}

.hint {
  margin: 0.75rem 0 0;
  font-size: 0.78125rem;
  color: var(--color-muted);
  line-height: 1.4;
}

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

