<script setup lang="ts">
/**
 * A player title, drawn as the rarity plate the game gives it.
 *
 * CHUNITHM ships each rarity as its own nameplate image
 * (`honor_bg_<rarity>.png`), and the parser already reads the rarity out of
 * that filename — it was reaching the page and being thrown away, so every
 * title rendered identically no matter how rare.
 *
 * Fills and rims below are sampled from those images: the body from the centre,
 * the border from the rim, which is where the rarities actually differ. Note
 * `expert` and `gold` share a rim in SEGA's own art — that is the game, not an
 * oversight here.
 *
 * The plates are light with dark lettering in every rarity, which is why these
 * are filled rather than outlined and why the ink does not follow the page
 * theme.
 */
const props = defineProps<{ rarity: string, size?: 'sm' | 'md' }>()

/** Every rarity the CDN serves. Probed, not guessed. */
const KNOWN = new Set([
  'normal',
  'silver',
  'gold',
  'expert',
  'master',
  'ultima',
  'rainbow',
  'staff',
  'maimai',
  'ongeki',
])

const kind = computed(() =>
  KNOWN.has(props.rarity) ? props.rarity : 'normal',
)

/**
 * Says so when a rarity is one we have no plate for.
 *
 * A silent fallback is how `expert` spent its first outing looking like a
 * plain grey title: the rarity was in the data the whole time.
 */
const label = computed(() =>
  KNOWN.has(props.rarity)
    ? `Title rarity: ${props.rarity}`
    : `Title rarity: ${props.rarity} (no plate for this one yet)`,
)
</script>

<template>
  <span
    class="honor"
    :class="[`honor--${kind}`, `honor--${size ?? 'md'}`]"
    :title="label"
  >
    <span class="honor__text"><slot /></span>
  </span>
</template>

<style scoped>
.honor {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  border: 1px solid var(--rim);
  border-radius: 2px;
  background: linear-gradient(180deg, var(--plate-top), var(--plate-bottom));
  color: #1a1a20;
  font-weight: 700;
  line-height: 1.4;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}

.honor--sm {
  font-size: 0.625rem;
  padding: 0.08rem 0.55rem;
}

.honor--md {
  font-size: 0.75rem;
  padding: 0.15rem 0.75rem;
}

.honor__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.honor--normal {
  --plate-top: #f4f4f4;
  --plate-bottom: #dddbda;
  --rim: #b9b8b7;
}

.honor--silver {
  --plate-top: #ffffff;
  --plate-bottom: #d8ecf5;
  --rim: #7ebbdd;
}

/* SEGA gives `expert` the same rim as `gold`. Kept identical on purpose. */
.honor--gold,
.honor--expert {
  --plate-top: #fffde0;
  --plate-bottom: #ffffb6;
  --rim: #e8b204;
}

.honor--master {
  --plate-top: #fffff4;
  --plate-bottom: #ffffe5;
  --rim: #ffb861;
}

.honor--ultima {
  --plate-top: #ffffff;
  --plate-bottom: #fffff2;
  --rim: #565656;
}

.honor--rainbow {
  background: linear-gradient(
    100deg,
    #ffc4ff,
    #fff3b0,
    #c8ffd9,
    #92ffff,
    #ff9cff
  );
  --rim: #6fe4e4;
}

/* Awarded by SEGA rather than earned, so they carry their own branding. */
.honor--staff {
  --plate-top: #f2f8ff;
  --plate-bottom: #b8dcf7;
  --rim: #097bce;
}

.honor--maimai {
  --plate-top: #ffffff;
  --plate-bottom: #b6f4fd;
  --rim: #10bff9;
}

.honor--ongeki {
  background: linear-gradient(100deg, #ffc9ff, #b8f7f6);
  --rim: #e07ae0;
}
</style>
