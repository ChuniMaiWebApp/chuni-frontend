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
  <section class="login">
    <h1>Sign in</h1>
    <p class="lead">
      Sign in with the SEGA ID you use for CHUNITHM. Your scores are read
      straight from CHUNITHM-NET.
    </p>

    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'password'"
        :class="{ active: mode === 'password' }"
        @click="mode = 'password'"
      >
        SEGA ID
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'cookie'"
        :class="{ active: mode === 'cookie' }"
        @click="mode = 'cookie'"
      >
        Cookie
      </button>
    </div>

    <div v-if="error" class="panel panel--error">{{ error }}</div>

    <form v-if="mode === 'password'" class="panel" @submit.prevent="submitPassword">
      <div class="field">
        <label for="username">SEGA ID</label>
        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          spellcheck="false"
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
          required
        >
      </div>

      <button type="submit" class="primary" :disabled="busy || !username || !password">
        {{ busy ? 'Signing in…' : 'Sign in' }}
      </button>

      <p class="notice">
        Your password is forwarded to SEGA to obtain a session and is
        <strong>not stored</strong> by this app. The session itself is kept
        encrypted. If your SEGA ID uses two-factor authentication, SEGA will
        reject this form — use the Cookie tab instead.
      </p>
    </form>

    <form v-else class="panel" @submit.prevent="submitClal">
      <div class="field">
        <label for="clal">CHUNITHM-NET <code>clal</code> cookie</label>
        <input
          id="clal"
          v-model="clal"
          type="password"
          autocomplete="off"
          spellcheck="false"
          placeholder="64 lowercase letters and digits"
          required
        >
        <small>
          Found under <code>lng-tgk-aime-gw.am-all.net</code> in your browser's
          cookie storage. Treat it like a password.
        </small>
      </div>

      <button type="submit" class="primary" :disabled="busy || !clal">
        {{ busy ? 'Checking…' : 'Link account' }}
      </button>

      <p class="notice">
        Use this if your account has two-factor authentication, or if you would
        rather not type your password here at all.
      </p>
    </form>
  </section>
</template>

<style scoped>
.login {
  max-width: 34rem;
}

.lead {
  color: var(--color-muted);
  margin-bottom: 1.5rem;
}

.tabs {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.tabs button {
  font: inherit;
  font-size: 0.875rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.tabs button.active {
  background: var(--color-surface);
  border-color: var(--color-accent);
  color: var(--color-text);
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  padding: 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel--error {
  border-color: var(--color-down);
  color: var(--color-down);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
}

input {
  font: inherit;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
}

input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

small {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.primary {
  align-self: flex-start;
  font: inherit;
  font-weight: 600;
  padding: 0.5rem 1.1rem;
  border: none;
  border-radius: 8px;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notice {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-muted);
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}
</style>
