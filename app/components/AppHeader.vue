<script setup lang="ts">
const { user, isSignedIn, logout } = useAuth()
const { preference, cycle } = useTheme()

const THEME_LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' } as const
const THEME_ICON = { system: 'monitor', light: 'sun', dark: 'moon' } as const

const route = useRoute()
const MORE_ROUTES = ['/top', '/statistics', '/improve', '/ranking', '/songs', '/tools', '/support']
const isMoreActive = computed(() => MORE_ROUTES.some((r) => route.path.startsWith(r)))

const signOut = async () => {
  await logout()
  await navigateTo('/')
}

// Desktop dropdown, for the medium-width breakpoint where the full nav no
// longer fits in one row.
const showMoreMenu = ref(false)
const toggleMore = () => {
  showMoreMenu.value = !showMoreMenu.value
}
const closeMore = () => {
  showMoreMenu.value = false
}

/**
 * Mobile "More" sheet.
 *
 * The bottom bar only has room for five destinations. Everything else —
 * Song Database, Tools, Statistics, Improvement Targets, Top PBs, Rankings,
 * the theme toggle, sign out — used to have no path to it at all below the
 * 768px breakpoint: the desktop dropdown that covers the same gap on medium
 * screens is inside `.desktop-only`, so phones lost it entirely.
 */
const showMobileMore = ref(false)
const toggleMobileMore = () => {
  showMobileMore.value = !showMobileMore.value
}
const closeMobileMore = () => {
  showMobileMore.value = false
}

// A route change (including the ones this sheet's own links trigger) should
// always close it — otherwise it stays open, covering the page it just sent
// the user to.
watch(() => route.path, closeMobileMore)

const onMobileMoreKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMobileMore()
}

watch(showMobileMore, (open) => {
  if (open) {
    document.addEventListener('keydown', onMobileMoreKeydown)
    document.body.style.overflow = 'hidden'
  }
  else {
    document.removeEventListener('keydown', onMobileMoreKeydown)
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onMobileMoreKeydown)
})
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
          <span class="nav-divider nav-divider--xl" aria-hidden="true" />
          <NuxtLink to="/support" class="app-header__link nav-item--xl">Support</NuxtLink>
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
              <NuxtLink to="/support" class="app-header__dropdown-item">Support Project</NuxtLink>
            </div>
          </div>
        </template>
        <template v-else>
          <NuxtLink to="/songs" class="app-header__link">Song Database</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />
          <NuxtLink to="/tools" class="app-header__link">Tools &amp; Calculators</NuxtLink>
          <span class="nav-divider" aria-hidden="true" />
          <NuxtLink to="/support" class="app-header__link">Support</NuxtLink>
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

  </header>

  <!--
    Teleported out of <header>, not just visually placed at the bottom of it.
    `.app-header` carries `backdrop-filter: blur(8px)` for the frosted-glass
    look, and CSS makes any element with `backdrop-filter` (also `filter`,
    `transform`, `perspective`) the containing block for `position: fixed`
    descendants. With this nav still inside `.app-header`, its `bottom: 0`
    resolved against the *header's* box — a hairline-thin sticky element
    pinned to the top of the viewport — not the screen's actual bottom. The
    whole bar rendered docked under the address bar, overlapping the logo,
    instead of anywhere near the thumb. Moving it to <body> gives it the real
    viewport as its containing block, the same fix already used for
    AppConfirmModal and AppToastContainer.
  -->
  <Teleport to="body">
    <nav class="mobile-bottom-nav">
      <NuxtLink to="/" class="mobile-nav__item" @click="closeMobileMore">
        <AppIcon name="home" :size="20" />
        <span class="mobile-nav__label">Home</span>
      </NuxtLink>
      <NuxtLink v-if="isSignedIn" to="/recent" class="mobile-nav__item" @click="closeMobileMore">
        <AppIcon name="history" :size="20" />
        <span class="mobile-nav__label">Recent</span>
      </NuxtLink>
      <NuxtLink v-if="isSignedIn" to="/best50" class="mobile-nav__item" @click="closeMobileMore">
        <AppIcon name="trophy" :size="20" />
        <span class="mobile-nav__label">Best 50</span>
      </NuxtLink>

      <!--
        Replaces the old always-disabled "Queue" slot. A bar with only five
        physical slots has no room to give one away permanently to a feature
        that isn't live yet — Queue now lives inside the sheet this opens,
        still marked "coming soon", and this slot instead reaches everything
        that previously had no mobile path to it at all.
      -->
      <button
        type="button"
        class="mobile-nav__item mobile-nav__item--button"
        :class="{ 'is-active': showMobileMore }"
        :aria-expanded="showMobileMore"
        aria-haspopup="dialog"
        @click="toggleMobileMore"
      >
        <AppIcon name="grid" :size="20" />
        <span class="mobile-nav__label">More</span>
      </button>

      <NuxtLink v-if="isSignedIn" to="/profile" class="mobile-nav__item" @click="closeMobileMore">
        <AppIcon name="user" :size="20" />
        <span class="mobile-nav__label">Profile</span>
      </NuxtLink>
      <NuxtLink v-else to="/login" class="mobile-nav__item" @click="closeMobileMore">
        <AppIcon name="key" :size="20" />
        <span class="mobile-nav__label">Sign In</span>
      </NuxtLink>
    </nav>
  </Teleport>

  <Teleport to="body">
    <Transition name="sheet-fade">
      <div
        v-if="showMobileMore"
        class="mobile-more-backdrop"
        @click.self="closeMobileMore"
      >
        <div class="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="More">
          <div class="mobile-more-handle" aria-hidden="true" />

          <div class="mobile-more-list">
            <NuxtLink to="/songs" class="mobile-more-item">
              <AppIcon name="music" :size="20" />
              <span>Song Database</span>
            </NuxtLink>
            <NuxtLink to="/tools" class="mobile-more-item">
              <AppIcon name="sliders" :size="20" />
              <span>Tools &amp; Calculators</span>
            </NuxtLink>
            <NuxtLink to="/support" class="mobile-more-item">
              <AppIcon name="heart" :size="20" />
              <span>Support Project</span>
            </NuxtLink>

            <template v-if="isSignedIn">
              <NuxtLink to="/statistics" class="mobile-more-item">
                <AppIcon name="chart" :size="20" />
                <span>Statistics</span>
              </NuxtLink>
              <NuxtLink to="/improve" class="mobile-more-item">
                <AppIcon name="target" :size="20" />
                <span>Improvement Targets</span>
              </NuxtLink>
              <NuxtLink to="/top" class="mobile-more-item">
                <AppIcon name="trophy" :size="20" />
                <span>Top Personal Bests</span>
              </NuxtLink>
              <NuxtLink to="/ranking" class="mobile-more-item">
                <AppIcon name="trending" :size="20" />
                <span>Server Rankings</span>
              </NuxtLink>
              <span class="mobile-more-item mobile-more-item--disabled" title="Queue feature coming soon">
                <AppIcon name="users" :size="20" />
                <span>Queue</span>
                <span class="badge-soon">Soon</span>
              </span>
            </template>
          </div>

          <div class="mobile-more-footer">
            <button type="button" class="mobile-more-theme" @click="cycle()">
              <AppIcon :name="THEME_ICON[preference]" :size="16" />
              Theme: {{ THEME_LABEL[preference] }}
            </button>

            <div v-if="user" class="mobile-more-account">
              <span class="mobile-more-user">{{ user.displayName }}</span>
              <button type="button" class="mobile-more-signout" @click="signOut(); closeMobileMore()">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
.mobile-nav__item.router-link-active,
.mobile-nav__item.is-active {
  color: var(--color-accent);
}

.mobile-nav__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* The "More" slot is a <button>, not a <NuxtLink> — undo the browser chrome
   so it matches its siblings exactly instead of looking like a stray control. */
.mobile-nav__item--button {
  appearance: none;
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
}

.mobile-nav__icon {
  font-size: 1.125rem;
  line-height: 1.2;
}

/* Mobile "More" sheet */
.mobile-more-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  background: rgba(8, 6, 12, 0.6);
  backdrop-filter: blur(4px);
}

.mobile-more-sheet {
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-bottom: none;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.35);
  padding: 0.5rem 0.75rem calc(1rem + env(safe-area-inset-bottom));
}

.mobile-more-handle {
  width: 2.25rem;
  height: 4px;
  margin: 0.25rem auto 0.75rem;
  border-radius: 999px;
  background: var(--color-border);
}

.mobile-more-list {
  display: flex;
  flex-direction: column;
}

.mobile-more-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: background 0.15s ease;
}

.mobile-more-item:hover,
.mobile-more-item:active,
.mobile-more-item.router-link-active {
  background: var(--color-surface-hover);
}

.mobile-more-item.router-link-active {
  color: var(--color-accent);
}

.mobile-more-item--disabled {
  color: var(--color-muted);
  opacity: 0.55;
  cursor: not-allowed;
}

.mobile-more-item--disabled:hover {
  background: none;
}

.mobile-more-item .badge-soon {
  margin-left: auto;
}

.mobile-more-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.mobile-more-theme,
.mobile-more-signout {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  width: fit-content;
}

.mobile-more-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.25rem 0.75rem;
}

.mobile-more-user {
  color: var(--color-muted);
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-more-signout {
  color: var(--color-muted);
  flex-shrink: 0;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-fade-enter-active .mobile-more-sheet,
.sheet-fade-leave-active .mobile-more-sheet {
  transition: transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-fade-enter-from .mobile-more-sheet,
.sheet-fade-leave-to .mobile-more-sheet {
  transform: translateY(100%);
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

