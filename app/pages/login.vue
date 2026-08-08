<script setup lang="ts">
useHead({ title: 'ChunithmQueue · Sign in' })

const route = useRoute()
const { signIn, linkWithClal } = useAuth()

const redirectTo = computed(() => (route.query.redirect as string) || '/profile')

/** Cookie linking stays available: TOTP accounts cannot use a password here. */
const mode = ref<'password' | 'cookie'>('password')
const error = ref<string | null>(null)
const busy = ref(false)

const username = ref('')
const password = ref('')
const clal = ref('')

const readError = (caught: unknown): string => {
  const data = (caught as { data?: { message?: string | string[] } }).data

  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message
  }

  return (caught as Error).message
}

const submitPassword = async () => {
  error.value = null
  busy.value = true

  try {
    await signIn(username.value.trim(), password.value)
    // Drop the password from memory as soon as it has served its purpose.
    password.value = ''
    await navigateTo(redirectTo.value)
  }
  catch (caught) {
    error.value = readError(caught)
  }
  finally {
    busy.value = false
  }
}

const submitClal = async () => {
  error.value = null
  busy.value = true

  try {
    await linkWithClal(clal.value.trim())
    await navigateTo(redirectTo.value)
  }
  catch (caught) {
    error.value = readError(caught)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="login-page">
    <header class="page-header">
      <h1>Sign In</h1>
      <p class="lead">
        Connect your SEGA ID to automatically fetch score records from CHUNITHM-NET.
      </p>
    </header>

    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'password'"
        :class="{ active: mode === 'password' }"
        class="tab-btn"
        @click="mode = 'password'"
      >
        <AppIcon name="key" /> SEGA ID &amp; Password
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'cookie'"
        :class="{ active: mode === 'cookie' }"
        class="tab-btn"
        @click="mode = 'cookie'"
      >
        CHUNITHM-NET cookie
      </button>
    </div>

    <p v-if="error" class="panel panel--error">{{ error }}</p>

    <form v-if="mode === 'password'" class="panel card" @submit.prevent="submitPassword">
      <div class="field">
        <label for="username">SEGA ID</label>
        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          spellcheck="false"
          placeholder="Your SEGA ID login username"
          required
        >
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Your SEGA ID password"
          required
        >
      </div>

      <button type="submit" class="btn btn--primary" :disabled="busy || !username || !password">
        {{ busy ? 'Signing in…' : 'Sign in with SEGA ID' }}
      </button>

      <p class="notice">
        Your credentials are sent directly to SEGA to acquire a session token and are
        <strong>never stored</strong> on our servers. If your SEGA ID has 2-Factor Authentication enabled, use the Cookie tab instead.
      </p>
    </form>

    <form v-else class="panel card" @submit.prevent="submitClal">
      <div class="field">
        <label for="clal">CHUNITHM-NET <code>clal</code> Cookie Value</label>
        <input
          id="clal"
          v-model="clal"
          type="password"
          autocomplete="off"
          spellcheck="false"
          placeholder="64 lowercase letters and digits"
          required
        >
        <small class="field-help">
          Found under <code>lng-tgk-aime-gw.am-all.net</code> in browser developer storage. Treat it with care like a password.
        </small>
      </div>

      <button type="submit" class="btn btn--primary" :disabled="busy || !clal">
        {{ busy ? 'Verifying…' : 'Link via Cookie' }}
      </button>

      <p class="notice">
        Recommended for accounts using 2FA, or if you prefer not to enter your password directly.
      </p>
    </form>
  </section>
</template>

<style scoped>
.login-page {
  max-width: 32rem;
  margin: 1rem auto;
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
  line-height: 1.4;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.45rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface) 86%);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.panel {
  padding: 1.375rem;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.panel--error {
  border-color: var(--color-down);
  color: var(--color-down);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.875rem 1.125rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.8125rem;
  font-weight: 750;
  color: var(--color-text);
}

.field input {
  font: inherit;
  font-size: 0.9375rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
}

.field input:focus {
  outline: 2px solid var(--color-accent);
  border-color: transparent;
}

.field-help {
  font-size: 0.75rem;
  color: var(--color-muted);
  line-height: 1.4;
}

.field-help code,
.field label code {
  background: var(--color-bg);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.notice {
  margin: 0;
  font-size: 0.78125rem;
  line-height: 1.4;
  color: var(--color-muted);
  padding-top: 0.875rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1.125rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

