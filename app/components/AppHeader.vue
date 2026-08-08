<script setup lang="ts">
const { user, isSignedIn, logout } = useAuth()
const { preference, cycle } = useTheme()

const THEME_LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' } as const
const THEME_ICON = { system: '◐', light: '☀', dark: '☾' } as const

const signOut = async () => {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <NuxtLink to="/" class="app-header__brand">
        <span aria-hidden="true">🐧</span>
        <span>ChunithmQueue</span>
      </NuxtLink>

      <nav class="app-header__nav">
        <template v-if="isSignedIn">
          <NuxtLink to="/profile">Profile</NuxtLink>
          <NuxtLink to="/recent">Recent</NuxtLink>
          <NuxtLink to="/best50">Best 50</NuxtLink>
          <NuxtLink to="/top">Top</NuxtLink>
          <NuxtLink to="/statistics">Stats</NuxtLink>
          <NuxtLink to="/improve">Improve</NuxtLink>
          <NuxtLink to="/ranking">Rankings</NuxtLink>
        </template>
        <!-- Song data and calculators work without an account. -->
        <NuxtLink to="/songs">Songs</NuxtLink>
        <NuxtLink to="/tools">Tools</NuxtLink>
      </nav>

      <div class="app-header__account">
        <button
          type="button"
          class="app-header__theme"
          :title="`Theme: ${THEME_LABEL[preference]}`"
          :aria-label="`Theme: ${THEME_LABEL[preference]}. Click to change.`"
          @click="cycle()"
        >
          <span aria-hidden="true">{{ THEME_ICON[preference] }}</span>
        </button>
        <template v-if="user">
          <span class="app-header__user">{{ user.displayName }}</span>
          <button type="button" @click="signOut">Sign out</button>
        </template>
        <NuxtLink v-else to="/login" class="app-header__signin">Sign in</NuxtLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  padding: 0.875rem 1.25rem;
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--color-text);
  text-decoration: none;
}

.app-header__nav {
  display: flex;
  gap: 1rem;
  font-size: 0.9375rem;
}

.app-header__nav a {
  color: var(--color-muted);
  text-decoration: none;
}

.app-header__nav a:hover,
.app-header__nav a.router-link-active {
  color: var(--color-text);
}

.app-header__account {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.app-header__user {
  color: var(--color-muted);
}

/* Square, so it reads as an icon control rather than another word in the row. */
.app-header__theme {
  width: 1.85rem;
  height: 1.85rem;
  padding: 0 !important;
  display: inline-grid;
  place-items: center;
  line-height: 1;
}

.app-header__account button {
  font: inherit;
  font-size: 0.8125rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.app-header__signin {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
}
</style>
