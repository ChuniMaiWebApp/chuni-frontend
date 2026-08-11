<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <div class="app-shell">
    <!--
      Twelve pages await their data in setup, which blocks the route change:
      tapping a tab left the previous page on screen with nothing to say a new
      one was coming. This bar starts the moment navigation does, so the tap
      is acknowledged before any request finishes.
    -->
    <NuxtLoadingIndicator
      :height="2"
      :throttle="0"
      color="var(--color-accent)"
    />

    <AppHeader />

    <main class="app-main">
      <slot />
    </main>

    <footer class="app-footer">
      <span>ChunithmWebApp · {{ year }}</span>
    </footer>

    <AppConfirmModal />
    <AppToastContainer />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 100rem;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
}

.app-footer {
  padding: 1.25rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-muted);
  border-top: 1px solid var(--color-border);
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .app-main {
    padding: 1rem 1rem 5.5rem;
  }
  .app-footer {
    margin-bottom: 4rem;
  }
}
</style>

