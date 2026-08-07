<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <main class="app-main">
      <slot />
    </main>

    <footer class="app-footer">
      <span>ChunithmQueue · {{ year }}</span>
    </footer>
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
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
}

.app-footer {
  padding: 1.25rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-muted);
  border-top: 1px solid var(--color-border);
}
</style>
