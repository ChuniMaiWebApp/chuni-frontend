<script setup lang="ts">
const { user, isSignedIn, logout } = useAuth()
const { preference, cycle } = useTheme()

const THEME_LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' } as const
const THEME_ICON = { system: 'monitor', light: 'sun', dark: 'moon' } as const

const signOut = async () => {
  await logout()
  await navigateTo('/')
}

const showMoreMenu = ref(false)
const toggleMore = () => {
  showMoreMenu.value = !showMoreMenu.value
}
const closeMore = () => {
  showMoreMenu.value = false
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <NuxtLink to="/" class="app-header__brand" @click="closeMore">
        <AppIcon name="music" :size="18" class="app-header__logo-icon" />
        <span class="app-header__brand-text">Chunithm<span class="app-header__brand-accent">Queue</span></span>
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="app-header__nav desktop-only">
        <template v-if="isSignedIn">
          <NuxtLink to="/recent" class="app-header__link">Recent</NuxtLink>
          <NuxtLink to="/best50" class="app-header__link">Best 50</NuxtLink>
          <NuxtLink to="/profile" class="app-header__link">Profile</NuxtLink>
          <span class="app-header__link app-header__link--disabled" title="Queue feature coming soon">
            Queue <span class="badge-soon">Soon</span>
          </span>

          <div class="app-header__dropdown-container">
            <button
              type="button"
              class="app-header__more-btn"
              :aria-expanded="showMoreMenu"
              @click="toggleMore"
            >
              More <AppIcon name="chevronDown" :size="13" />
            </button>
            <div v-if="showMoreMenu" class="app-header__dropdown" @click="closeMore">
              <NuxtLink to="/top" class="app-header__dropdown-item">Top Personal Bests</NuxtLink>
              <NuxtLink to="/statistics" class="app-header__dropdown-item">Statistics</NuxtLink>
              <NuxtLink to="/improve" class="app-header__dropdown-item">Improvement Targets</NuxtLink>
              <NuxtLink to="/ranking" class="app-header__dropdown-item">Server Rankings</NuxtLink>
              <div class="app-header__dropdown-divider" />
              <NuxtLink to="/songs" class="app-header__dropdown-item">Song Database</NuxtLink>
              <NuxtLink to="/tools" class="app-header__dropdown-item">Tools & Calculators</NuxtLink>
            </div>
          </div>
        </template>
        <template v-else>
          <NuxtLink to="/songs" class="app-header__link">Songs</NuxtLink>
          <NuxtLink to="/tools" class="app-header__link">Tools</NuxtLink>
        </template>
      </nav>

      <div class="app-header__account">
        <button
          type="button"
          class="app-header__theme"
          :title="`Theme: ${THEME_LABEL[preference]}`"
          :aria-label="`Theme: ${THEME_LABEL[preference]}. Click to change.`"
          @click="cycle()"
        >
          <AppIcon :name="THEME_ICON[preference]" :size="15" />
          <span class="theme-label">{{ THEME_LABEL[preference] }}</span>
        </button>

        <template v-if="user">
          <span class="app-header__user">{{ user.displayName }}</span>
          <button type="button" class="app-header__btn" @click="signOut">Sign out</button>
        </template>
        <NuxtLink v-else to="/login" class="app-header__signin">Sign in</NuxtLink>
      </div>
    </div>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="mobile-bottom-nav">
      <NuxtLink to="/" class="mobile-nav__item">
        <AppIcon name="home" :size="20" />
        <span class="mobile-nav__label">Home</span>
      </NuxtLink>
      <NuxtLink v-if="isSignedIn" to="/recent" class="mobile-nav__item">
        <AppIcon name="history" :size="20" />
        <span class="mobile-nav__label">Recent</span>
      </NuxtLink>
      <NuxtLink v-if="isSignedIn" to="/best50" class="mobile-nav__item">
        <AppIcon name="trophy" :size="20" />
        <span class="mobile-nav__label">Best 50</span>
      </NuxtLink>
      <span class="mobile-nav__item mobile-nav__item--disabled" title="Queue feature coming soon">
        <AppIcon name="users" :size="20" />
        <span class="mobile-nav__label">Queue</span>
      </span>
      <NuxtLink v-if="isSignedIn" to="/profile" class="mobile-nav__item">
        <AppIcon name="user" :size="20" />
        <span class="mobile-nav__label">Profile</span>
      </NuxtLink>
      <NuxtLink v-else to="/login" class="mobile-nav__item">
        <AppIcon name="key" :size="20" />
        <span class="mobile-nav__label">Sign In</span>
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  backdrop-filter: blur(8px);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  padding: 0.75rem 1.25rem;
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
  text-decoration: none;
  font-size: 1.0625rem;
}

.app-header__logo-icon {
  color: var(--color-accent);
}

.app-header__brand-accent {
  color: var(--color-accent);
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
}

.app-header__link {
  color: var(--color-muted);
  text-decoration: none;
  transition: color 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.app-header__link:hover,
.app-header__link.router-link-active {
  color: var(--color-text);
}

.app-header__link--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.badge-soon {
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  text-transform: uppercase;
}

.app-header__dropdown-container {
  position: relative;
}

.app-header__more-btn {
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
}

.app-header__more-btn:hover {
  color: var(--color-text);
}

.app-header__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 12rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  padding: 0.35rem 0;
  z-index: 110;
  display: flex;
  flex-direction: column;
}

.app-header__dropdown-item {
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: var(--color-muted);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.app-header__dropdown-item:hover,
.app-header__dropdown-item.router-link-active {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.app-header__dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.35rem 0;
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
  font-weight: 500;
}

.app-header__theme {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.app-header__theme:hover {
  border-color: var(--color-accent);
}

.app-header__btn {
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.app-header__btn:hover {
  color: var(--color-text);
  border-color: var(--color-muted);
}

.app-header__signin {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: var(--color-accent-subtle);
}

/* Mobile Bottom Nav */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 0.4rem 0.5rem calc(0.4rem + env(safe-area-inset-bottom));
  justify-content: space-around;
  backdrop-filter: blur(12px);
}

.mobile-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.6875rem;
  font-weight: 500;
  transition: color 0.15s ease;
}

.mobile-nav__item:hover,
.mobile-nav__item.router-link-active {
  color: var(--color-accent);
}

.mobile-nav__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mobile-nav__icon {
  font-size: 1.125rem;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  .mobile-bottom-nav {
    display: flex;
  }
  .theme-label {
    display: none;
  }
}
</style>

