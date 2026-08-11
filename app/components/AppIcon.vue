<script setup lang="ts">
/**
 * Line icons, drawn inline.
 *
 * Emoji were doing this job and gave the whole app away as machine-designed:
 * they carry another vendor's colour, another vendor's weight, and they sit on
 * the text baseline like punctuation rather than like part of the interface.
 *
 * Stroke geometry rather than an icon package, for two reasons. A font is a
 * few hundred kilobytes for the twenty glyphs this app needs, and the app is
 * opened on arcade wifi. And a stroked set inherits `currentColor` and the
 * surrounding weight, so an icon beside 12px muted text looks like it belongs
 * there instead of shouting.
 *
 * All paths are on a 24×24 grid with a 2-unit stroke, scaled by the caller.
 */

const PATHS: Record<string, string> = {
  // Circular arrow, open at the top right, with a head pointing back into it.
  refresh: 'M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4',
  edit: 'M4 20h4L19 9a2.12 2.12 0 0 0-3-3L5 17v3Z M14 6l4 4',
  eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M4 4l16 16 M10.6 6.2A9.6 9.6 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3 3.5 M7.3 8.1C4.2 9.7 2 12 2 12s3.6 6 10 6a10 10 0 0 0 3.2-.5',
  download: 'M12 3v11 M7.5 10.5 12 15l4.5-4.5 M4 19h16',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3',
  // A cup with two handles on a stem.
  trophy: 'M7 4h10v5a5 5 0 0 1-10 0V4Z M7 6H4v2a3 3 0 0 0 3 3 M17 6h3v2a3 3 0 0 1-3 3 M10 19h4 M12 14v5',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  music: 'M9 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M9 15V4l11-2v11 M20 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  /*
   * Bow on the left, shaft running right, teeth pointing down. Drawn on a
   * diagonal first, which at 16px was indistinguishable from `search` — same
   * circle, same angled stem.
   */
  key: 'M7 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M10.5 12H21 M17.5 12v3.5 M20.5 12v2.5',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 1v3 M12 20v3 M4.2 4.2l2.1 2.1 M17.7 17.7l2.1 2.1 M1 12h3 M20 12h3 M4.2 19.8l2.1-2.1 M17.7 6.3l2.1-2.1',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z',
  monitor: 'M3 5h18v11H3V5Z M8 21h8 M12 16v5',
  chevronDown: 'M6 9l6 6 6-6',
  arrowRight: 'M4 12h15 M13 6l6 6-6 6',
  check: 'M4 12.5 9.5 18 20 6',
  close: 'M6 6l12 12 M18 6 6 18',
  warning: 'M12 3 1.5 21h21L12 3Z M12 10v5 M12 18h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5.5l3.5 2',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  // A stack of records, for anything about the local score cache.
  layers: 'M12 3 2 8l10 5 10-5-10-5Z M2 16l10 5 10-5 M2 12l10 5 10-5',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  home: 'M3 10.5 12 3l9 7.5 M5.5 9v11h13V9 M9.5 20v-6h5v6',
  // Clock with a counterclockwise arrow: what has already been played.
  history: 'M3.2 9.5A9 9 0 1 1 3 12.6 M3 4v5.5h5.5 M12 8v4.5l3 1.8',
  // A queue of people, for the waiting list.
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2 20v-.8A5.2 5.2 0 0 1 7.2 14h3.6a5.2 5.2 0 0 1 5.2 5.2v.8 M17 5.2a3.5 3.5 0 0 1 0 6.6 M18.5 14.2A4.5 4.5 0 0 1 22 18.6v1.4',
  plus: 'M12 5v14 M5 12h14',
  /** Map pin, for a physical arcade. */
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  /** Sliders, for the calculators. */
  sliders: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M20 18h0 M14 4v4 M8 10v4 M16 16v4',
  /** A line climbing to the right, for anything about getting better. */
  trending: 'M3 17l6-6 4 4 7-7 M21 8v5h-5',
  /** Four squares, for "more" — the rest of the app past what fits in a bar. */
  grid: 'M3 3h7v7H3V3Z M14 3h7v7h-7V3Z M3 14h7v7H3v-7Z M14 14h7v7h-7v-7Z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
}

export type IconName = keyof typeof PATHS

const props = withDefaults(
  defineProps<{
    name: IconName | string
    /** Rendered size in px. Defaults to the surrounding text size. */
    size?: number
    /** Thicker for large sizes, thinner for small — 2 suits 16–24px. */
    stroke?: number
  }>(),
  { size: 16, stroke: 2 },
)

const path = computed(() => PATHS[props.name])

if (import.meta.dev && !PATHS[props.name]) {
  console.warn(`[AppIcon] no icon named "${props.name}"`)
}
</script>

<template>
  <svg
    v-if="path"
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="stroke"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  ><path :d="path" /></svg>
</template>

<style scoped>
/*
 * Sits on the text baseline like a letter rather than hanging below it, which
 * is what makes an icon beside a label look placed rather than dropped in.
 */
.icon {
  display: inline-block;
  vertical-align: -0.135em;
  flex-shrink: 0;
}
</style>
