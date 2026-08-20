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
| `npm run preview` | Build OpenNext worker and preview in `workerd` via Wrangler |
| `npm run build:worker` | Build the Cloudflare Worker bundle only |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run deploy:live` | Build + deploy current branch/commit as the **live** production Worker (tagged) |
| `npm run cf:whoami` | Show Cloudflare auth account |
| `npm run cf:status` | Show the live Workers deployment status |

### Deploy from your machine

You do not need GitHub Actions or the Cloudflare dashboard to ship:

```bash
# one-time: log in if needed
npx wrangler login

# ship the current branch as production
npm run deploy:live
```

`deploy:live` tags the Worker version with the current git branch and short SHA (and marks `-dirty` if you have uncommitted changes), then rolls it out to 100% production traffic.

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
