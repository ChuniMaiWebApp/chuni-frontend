# ChunithmWebApp — Frontend

Web application interface for CHUNITHM & Maimai players, built with Nuxt 4 (Vue 3, Vite, TypeScript).

## Quickstart (Localhost)

### 1. Prerequisites
- Node.js >= 18.x (Node 20 LTS recommended)
- npm >= 9.x

### 2. Setup & Installation

```bash
# Clone repository
git clone https://github.com/ChuniMaiWebApp/chuni-frontend.git
cd chuni-frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 3. Development Server

```bash
npm run dev
```

Open `http://localhost:3100` (or `http://localhost:3000`) in your browser.

### Scripts

- `npm run dev` — Start development server with hot reload
- `npm run build` — Build production bundle
- `npm run preview` — Preview production build locally
- `npm run lint` — Lint and format code with ESLint
- `npm run typecheck` — Run TypeScript type checking

---

## Credits & Acknowledgements

Special thanks to the open-source community and project creators whose work made this platform possible:

- **[chuni-penguin](https://github.com/beer-psi/chuni-penguin)** by [beerpsi](https://github.com/beer-psi) — The original inspiration for this project.
- **[chunirec](https://developer.chunirec.net/)** — Essential chart constants and rating dataset.
- **[arcade-songs](https://github.com/zetaraku/arcade-songs)** by [zetaraku](https://github.com/zetaraku) — Data mapping and schema references.
