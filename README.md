# Hey, we're Stackwise 👋

<p align="center">
  <img width="1983" height="793" alt="Stackwise Banner" src="https://github.com/user-attachments/assets/4a7f3e2c-aa94-42b7-af0d-0cfe5fc7a8e9" />
</p>

We're an international software engineering company with African roots, building scalable software, AI systems, cloud infrastructure, and digital products for businesses worldwide. Our mission is to accelerate business growth by delivering world-class technology solutions that are secure, scalable, and beautifully designed.

---

## 🌍 What we build

At Stackwise, we take a strategic approach to software engineering. We don't just write code; we solve business problems.

### 🤖 AI & Automation
We integrate intelligent systems into your workflows. From AI-powered assistants and predictive analytics to automated operational tooling, we help companies reduce manual work and scale efficiently.

### ☁️ Cloud Infrastructure
We design and deploy robust, high-performance backends. Our team specializes in scalable databases, microservices architectures, serverless computing, and DevOps pipelines that guarantee high availability.

### 🌐 Web & Mobile Applications
We build responsive web platforms, intuitive SaaS products, and native mobile experiences that delight users. We focus on modern frameworks, clean UI/UX, and exceptional performance.

### ⚡ APIs & Backend Systems
We develop secure RESTful and GraphQL APIs that power everything from mobile apps to enterprise integrations, ensuring seamless data flow across your entire tech stack.

### 🧩 Developer Tools
We build utilities and open-source packages that help other engineers work faster, smarter, and with fewer friction points.

---

## 🛠️ Our Tech Stack

We utilize a modern, battle-tested technology stack to ensure our products are robust and future-proof:

- **Frontend:** React, Next.js, Vue.js, Tailwind CSS
- **Backend:** Node.js, Python, Go, TypeScript
- **Database:** PostgreSQL, MongoDB, Redis, Firebase
- **Cloud & DevOps:** AWS, Google Cloud, Docker, Kubernetes, CI/CD
- **AI/ML:** OpenAI, LangChain, TensorFlow

---

## 🖥️ Website (this repo)

Marketing site for [stackwisetechnologies.com](https://stackwisetechnologies.com), built with Next.js and deployed to Cloudflare Workers via OpenNext.

### Local development

```bash
npm install
npm run dev
```

Locales:

- English: [http://localhost:3000/en](http://localhost:3000/en)
- French: [http://localhost:3000/fr](http://localhost:3000/fr)

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js local dev server |
| `npm run build` | Production Next.js build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run db:migrate` | Apply SQL migrations to Neon (uses `.env.local` → `.env.prod` → `.env`) |
| `npm run db:migrate:prod` | Apply migrations to **production** Neon (`MIGRATE_ENV=prod`, reads `.env.prod` only) |
| `npm run preview` | Build OpenNext worker and preview in `workerd` via Wrangler |
| `npm run build:worker` | Build the Cloudflare Worker bundle only |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run deploy:live` | Full production deploy — see [Deploy to production](#deploy-to-production) |
| `npm run cf:secrets` | Upload Worker secrets from `.env.prod` without redeploying |
| `npm run cf:whoami` | Show Cloudflare auth account |
| `npm run cf:status` | Show the live Workers deployment status |

### Environment files

| File | Purpose |
| --- | --- |
| `.env.local` | Local development (gitignored). Copy from `.env.example`. |
| `.env.prod` | Production secrets and config (gitignored). Used by deploy and prod migrations. |
| `.env.example` | Template with placeholder keys — safe to commit. |

Never commit `.env.local` or `.env.prod`.

### Database migrations

Migrations live in `migrations/*.sql` and are applied in filename order.

```bash
# Local / dev Neon
npm run db:migrate

# Production Neon (uses DATABASE_URL from .env.prod)
npm run db:migrate:prod
```

The app also runs `ensureSchema()` on first DB access, which applies any pending migration files automatically.

### Deploy to production

You do not need GitHub Actions or the Cloudflare dashboard to ship:

```bash
# One-time: log in to Cloudflare
npx wrangler login

# Create .env.prod with production values (see .env.example)
# Then ship:
npm run deploy:live
```

#### What `npm run deploy:live` does

Runs `scripts/deploy-live.sh`, which:

1. **Checks auth** — exits if `wrangler whoami` fails.
2. **Build env** — copies `.env.prod` → `.env.production.local` so `NEXT_PUBLIC_*` (e.g. site URL) is baked into the Next.js build, not localhost from `.env.local`.
3. **Sync secrets** — calls `scripts/sync-cloudflare-env.mjs` to upload every key in `.env.prod` to the `stackwise-technologies` Worker via `wrangler secret bulk`.
4. **Build** — runs `npm run build:worker` (OpenNext + Next.js production build).
5. **Deploy** — publishes to Cloudflare Workers at 100% traffic, tagged with git branch + short SHA (e.g. `main@abc1234`).

#### Sync secrets only (no redeploy)

After editing `.env.prod`, push new secrets without rebuilding:

```bash
npm run cf:secrets
# equivalent to: node scripts/sync-cloudflare-env.mjs .env.prod
```

Requires `wrangler` login. Uploads all non-comment `KEY=value` lines from the file as encrypted Worker secrets.

#### Script reference (`scripts/`)

| File | Invoked by | Description |
| --- | --- | --- |
| `scripts/deploy-live.sh` | `npm run deploy:live` | End-to-end production deploy: env, secrets, build, publish. |
| `scripts/sync-cloudflare-env.mjs` | `npm run cf:secrets`, `deploy-live.sh` | Parses an env file and runs `wrangler secret bulk` for Worker `stackwise-technologies`. Optional arg: path to env file (default `.env.prod`). |
| `scripts/migrate.mjs` | `npm run db:migrate`, `npm run db:migrate:prod` | Loads env files, connects to Neon, runs all `migrations/*.sql` in order. Set `MIGRATE_ENV=prod` to force `.env.prod`. |

### Admin & payments (local)

- Admin dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)
- Payment admin uses Neon Postgres, KPay, and SMTP — configure in `.env.local`.
- For local payment E2E, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`.

---

## ❤️ Open Source Commitment

We believe in giving back to the community that makes our work possible. Some repositories here power production systems, while others are open-source projects, internal tools, and experiments that push technology forward. Feel free to explore, fork, and contribute!

---

## 🤝 Let's build together

Whether you're looking for a reliable technology partner, exploring our previous work, or looking to contribute to our open-source ecosystem—welcome to Stackwise.

We're always excited to discuss new ideas, solve complex problems, and build the future.

📫 **Get in touch:**
- **Website:** [https://stackwisetechnologies.com](https://stackwisetechnologies.com)
- **Email:** info@stackwisetechnologies.com
- **Book a Call:** [Schedule a 30-min discovery call](https://calendly.com/stackwisetechnologies-info/30min)

<p align="center">
  <i>Building the future, one line of code at a time.</i>
</p>
