<script setup lang="ts">
const { user, isSignedIn, logout } = useAuth()
const { preference, cycle } = useTheme()

const THEME_LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' } as const
const THEME_ICON = { system: 'monitor', light: 'sun', dark: 'moon' } as const

const route = useRoute()
const MORE_ROUTES = ['/top', '/statistics', '/improve', '/ranking', '/songs', '/tools']
const isMoreActive = computed(() => MORE_ROUTES.some((r) => route.path.startsWith(r)))

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
      <NuxtLink to="/" class="app-header__brand" title="Home" @click="closeMore">
        <img src="/x-verse-x-with-penguin.png" alt="CHUNITHM VERSE" class="app-header__logo-img">
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="app-header__nav desktop-only">
        <template v-if="isSignedIn">
          <NuxtLink to="/recent" class="app-header__link">Recent</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />
          <NuxtLink to="/best50" class="app-header__link">Best 50</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />
          <NuxtLink to="/profile" class="app-header__link">Profile</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />
          <NuxtLink to="/songs" class="app-header__link">Song DB</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />
          <NuxtLink to="/tools" class="app-header__link">Tools</NuxtLink>
          <span class="nav-divider nav-divider--xl" aria-hidden="true" />

          <!-- Expanded on PC / Widescreen (>= 1140px) -->
          <NuxtLink to="/statistics" class="app-header__link nav-item--xl">Statistics</NuxtLink>
          <span class="nav-divider nav-divider--xl" aria-hidden="true" />
          <NuxtLink to="/improve" class="app-header__link nav-item--xl">Improvement</NuxtLink>
          <span class="nav-divider nav-divider--xl" aria-hidden="true" />
          <NuxtLink to="/top" class="app-header__link nav-item--xl">Top PBs</NuxtLink>
          <span class="nav-divider nav-divider--xl" aria-hidden="true" />
          <NuxtLink to="/ranking" class="app-header__link nav-item--xl">Rankings</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />

          <span class="app-header__link app-header__link--disabled" title="Queue feature coming soon">
            Queue <span class="badge-soon">Soon</span>
          </span>

          <!-- Dropdown for medium laptop screens (< 1140px) -->
          <div class="app-header__dropdown-container nav-more--md">
            <span class="nav-divider" aria-hidden="true" />
            <button
              type="button"
              class="app-header__more-btn"
              :class="{ 'is-active': isMoreActive }"
              :aria-expanded="showMoreMenu"
              @click="toggleMore"
            >
              More <AppIcon name="chevronDown" :size="13" />
            </button>
            <div v-if="showMoreMenu" class="app-header__dropdown" @click="closeMore">
              <NuxtLink to="/statistics" class="app-header__dropdown-item">Statistics</NuxtLink>
              <NuxtLink to="/improve" class="app-header__dropdown-item">Improvement Targets</NuxtLink>
              <NuxtLink to="/top" class="app-header__dropdown-item">Top Personal Bests</NuxtLink>
              <NuxtLink to="/ranking" class="app-header__dropdown-item">Server Rankings</NuxtLink>
            </div>
          </div>
        </template>
        <template v-else>
          <NuxtLink to="/songs" class="app-header__link">Song Database</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />
          <NuxtLink to="/tools" class="app-header__link">Tools & Calculators</NuxtLink>
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
  gap: 1.5rem;
  width: 100%;
  max-width: 100rem;
  margin: 0 auto;
  padding: 0.35rem 1.25rem;
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  padding: 0;
  margin-right: 1.25rem;
}

.app-header__logo-img {
  height: 58px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.65)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.4));
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
}

.app-header__brand:hover .app-header__logo-img {
  transform: scale(1.08);
  filter: drop-shadow(0 0 14px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 28px rgba(168, 85, 247, 0.6));
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.84375rem;
  font-weight: 550;
}

.nav-divider {
  width: 1px;
  height: 14px;
  background: var(--color-border);
  opacity: 0.65;
  flex-shrink: 0;
  margin: 0 0.1rem;
}

.app-header__link {
  color: var(--color-muted);
  text-decoration: none;
  transition: color 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  position: relative;
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.app-header__link:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.app-header__link.router-link-active {
  color: var(--color-text);
  font-weight: 750;
  background: var(--color-accent-subtle);
}

.app-header__link.router-link-active::after,
.app-header__more-btn.is-active::after {
  content: '';
  position: absolute;
  bottom: -0.35rem;
  left: 0.4rem;
  right: 0.4rem;
  height: 2.5px;
  background: var(--color-accent);
  border-radius: 99px;
  box-shadow: 0 0 8px var(--color-accent);
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
  padding: 0.4rem 0.2rem;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.15s ease;
}

.app-header__more-btn:hover,
.app-header__more-btn.is-active {
  color: var(--color-text);
}

.app-header__more-btn.is-active {
  font-weight: 700;
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

@media (min-width: 1140px) {
  .nav-item--xl {
    display: inline-flex !important;
  }
  .nav-divider--xl {
    display: inline-block !important;
  }
  .nav-more--md {
    display: none !important;
  }
}

@media (max-width: 1139px) {
  .nav-item--xl,
  .nav-divider--xl {
    display: none !important;
  }
  .nav-more--md {
    display: inline-flex !important;
    align-items: center;
  }
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

