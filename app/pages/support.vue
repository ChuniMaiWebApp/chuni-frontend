<script setup lang="ts">
useHead({ title: 'Support Project — ChunithmWebApp' })

const repos = [
  {
    name: 'chuni-frontend',
    title: 'Frontend Repository',
    description: 'Nuxt 4 web application interface, components, and UI views.',
    url: 'https://github.com/ChuniMaiWebApp/chuni-frontend',
  },
  {
    name: 'chuni-backend',
    title: 'Backend API Repository',
    description: 'NestJS REST API server, Chunithm-net scraper, and score engine.',
    url: 'https://github.com/ChuniMaiWebApp/chuni-backend',
  },
  {
    name: 'chunimai-database',
    title: 'Database Infrastructure',
    description: 'Supabase & PostgreSQL schemas, migrations, and song database datasets.',
    url: 'https://github.com/ChuniMaiWebApp/chunimai-database',
  },
]

/**
 * One line each. A credit is an acknowledgement, not an essay — the reader
 * wants to know who and what, and the link covers the rest.
 */
const credits = [
  {
    name: 'chuni-penguin',
    role: 'The idea',
    text: 'beerpsi\'s bot started all this. Thank you.',
    url: 'https://github.com/beer-psi/chuni-penguin',
    linkLabel: 'github.com/beer-psi/chuni-penguin',
  },
  {
    name: 'chunirec',
    role: 'Chart constants',
    text: 'Every rating here rests on their data.',
    url: 'https://developer.chunirec.net/',
    linkLabel: 'developer.chunirec.net',
  },
  {
    name: 'arcade-songs',
    role: 'The map',
    text: 'Showed us where the data lives. Shaped our schema.',
    url: 'https://github.com/zetaraku/arcade-songs',
    linkLabel: 'github.com/zetaraku/arcade-songs',
  },
]
</script>

<template>
  <div class="support-page">
    <div class="support-hero">
      <div class="support-hero__badge">
        <AppIcon name="heart" :size="14" /> Support ChunithmWebApp
      </div>
      <h1 class="support-hero__title">
        Support the <span class="text-accent">Project</span>
      </h1>
      <!-- <p class="support-hero__lead">
        No donations and nothing to buy. The most useful things you can do are use it, report what breaks, and know whose work made it possible.
      </p> -->
    </div>

    <!-- Section 1: Usage Affirmation -->
    <section class="support-card support-card--primary">
      <div class="support-card__icon-wrapper">
        <AppIcon name="heart" :size="24" />
      </div>
      <div class="support-card__content">
        <h2 class="support-card__title">Your Trust is Our Greatest Support</h2>
        <p class="support-card__text">
          Simply using and trusting this website is already a massive support to us! Knowing that our platform helps players track their progress, calculate rating targets, and enjoy the game is our biggest motivation to keep building and improving.
        </p>
      </div>
    </section>

    <!-- Section 2: GitHub Contributions -->
    <section class="support-section">
      <div class="section-header">
        <h2>
          <AppIcon name="github" :size="20" /> Open Source &amp; Code Contributions
        </h2>
        <p class="section-subtitle">
          If you would like to help us improve, you can support by giving a star, submitting a Pull Request, or opening an issue on GitHub.
        </p>
      </div>

      <div class="repo-grid">
        <a
          v-for="repo in repos"
          :key="repo.name"
          :href="repo.url"
          target="_blank"
          rel="noopener noreferrer"
          class="repo-card"
        >
          <div class="repo-card__header">
            <AppIcon name="github" :size="20" />
            <span class="repo-card__name">{{ repo.name }}</span>
            <AppIcon name="external" :size="14" class="repo-card__ext" />
          </div>
          <h3 class="repo-card__title">{{ repo.title }}</h3>
          <p class="repo-card__desc">{{ repo.description }}</p>
          <div class="repo-card__actions">
            <span class="repo-card__tag">
              <AppIcon name="star" :size="13" /> Star on GitHub
            </span>
          </div>
        </a>
      </div>
    </section>

    <!-- Section 3: Credits -->
    <section class="support-section">
      <div class="section-header">
        <h2>
          <AppIcon name="heart" :size="20" /> Credits
        </h2>
        <p class="section-subtitle">
          This project did not start from nothing. These are the people whose work it was built on top of, and what each of them gave it.
        </p>
      </div>

      <div class="credit-grid">
        <article
          v-for="credit in credits"
          :key="credit.name"
          class="credit-card"
        >
          <div class="credit-card__header">
            <h3 class="credit-card__name">{{ credit.name }}</h3>
            <span class="credit-card__role">{{ credit.role }}</span>
          </div>

          <p class="credit-card__text">{{ credit.text }}</p>

          <a
            :href="credit.url"
            target="_blank"
            rel="noopener noreferrer"
            class="credit-card__link"
          >
            {{ credit.linkLabel }}
            <AppIcon name="external" :size="13" />
          </a>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.support-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 64rem;
  margin: 0 auto;
}

.support-hero {
  text-align: center;
  padding: 2rem 1rem 1rem;
}

.support-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: rgba(236, 72, 153, 0.12);
  color: #f472b6;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border: 1px solid rgba(236, 72, 153, 0.25);
}

.support-hero__title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  margin-bottom: 0.75rem;
}

.support-hero__lead {
  font-size: 1.125rem;
  color: var(--color-muted);
  max-width: 38rem;
  margin: 0 auto;
  line-height: 1.6;
}

/* Primary affirmation card */
.support-card {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 1.75rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.support-card--primary {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.06) 100%);
  border-color: rgba(168, 85, 247, 0.3);
}

.support-card__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.support-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.support-card__text {
  font-size: 0.95rem;
  color: var(--color-muted);
  line-height: 1.65;
  margin: 0;
}

/* Section Header */
.section-header {
  margin-bottom: 1.25rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.section-subtitle {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.5;
}

/* Repo grid */
.repo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1.25rem;
}

.repo-card {
  display: flex;
  flex-direction: column;
  padding: 1.35rem;
  border-radius: 0.875rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.repo-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-accent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.repo-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
  margin-bottom: 0.75rem;
}

.repo-card__name {
  font-weight: 600;
  font-family: monospace;
}

.repo-card__ext {
  margin-left: auto;
  opacity: 0.6;
}

.repo-card__title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: var(--color-text);
}

.repo-card__desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.5;
  margin: 0 0 1rem;
  flex-grow: 1;
}

.repo-card__actions {
  display: flex;
  align-items: center;
}

.repo-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #eab308;
  background: rgba(234, 179, 8, 0.1);
  padding: 0.25rem 0.65rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

/* Credits */
.credit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.25rem;
}

.credit-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.credit-card__header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
}

.credit-card__name {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
}

.credit-card__role {
  padding: 0.15rem 0.6rem;
  border-radius: 9999px;
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.credit-card__text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--color-muted);
}

.credit-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  /* Pushed to the bottom so links line up across cards of unequal length. */
  margin-top: auto;
  padding-top: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.credit-card__link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .support-hero__title {
    font-size: 1.85rem;
  }
  .support-card {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
