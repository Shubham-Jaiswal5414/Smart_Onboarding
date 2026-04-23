# 🤖 Smart Dataset Onboarding Assistant
### WeMakeDevs × OpenMetadata Hackathon 2026 · Track: MCP Ecosystem & AI Agents

> Paste a dataset schema → AI auto-generates description, tags, owner, PII detection & quality checks → push directly to OpenMetadata.

---

## 🚀 Live Demo

[View Live Demo](https://idyllic-travesseiro-85eae6.netlify.app) ✨

---

## ✨ Features

- **🤖 AI-Powered Analysis**: Uses Anthropic Claude to intelligently analyze dataset schemas
- **🎨 Modern UI**: Beautiful dark theme with smooth animations and responsive design
- **🔧 Demo Mode**: Test the app without an API key using mock data
- **📊 Quality Checks**: Automated data quality test generation
- **🛡️ PII Detection**: Automatic identification of personally identifiable information
- **🏷️ Smart Tagging**: AI-generated classification tags for better discoverability
- **👥 Owner Assignment**: Suggested team/owner assignment based on data domain
- **🚀 One-Click Deployment**: Easy deployment to Netlify or local Docker setup

---

## 🚀 Run Locally

### Prerequisites
- [Node.js 18+](https://nodejs.org) — check with `node -v`
- Optional: [Anthropic API Key](https://console.anthropic.com) for AI features (demo mode available)

### Quick Start

```bash
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Start development server
npm run dev
```

✅ Open **http://localhost:5173**

> **Demo Mode**: Check "Use Demo Mode" on the first screen to test without an API key!

### Full Setup with OpenMetadata

```bash
# 1. Start OpenMetadata (optional, for full integration)
docker compose up -d

# 2. Wait ~3 minutes, then visit http://localhost:8585
# Login: admin / admin

# 3. Start the MCP server (connects frontend to OpenMetadata)
cd mcp-server
npm install
npm start
```

---

## 🌐 Deploy to Netlify

### Option A — Netlify CLI (terminal, fastest)

```bash
# 1. Install Netlify CLI globally
npm install -g netlify-cli

# 2. Build the app
cd frontend
npm install
npm run build

# 3. Login to Netlify
netlify login

# 4. Deploy
netlify deploy --dir=dist --prod
```

After deploy, add your API key:
```bash
netlify env:set VITE_ANTHROPIC_KEY sk-ant-your-key-here
```

Your live URL: `https://your-site-name.netlify.app` ✅

---

### Option B — Netlify Dashboard + GitHub (recommended for hackathon)

**Step 1** — Push to GitHub
```bash
cd smart-onboarding
git init
git add .
git commit -m "feat: smart dataset onboarding assistant with modern UI"
git remote add origin https://github.com/YOUR_USERNAME/smart-onboarding.git
git push -u origin main
```

**Step 2** — Connect to Netlify
1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Choose **GitHub** → select your repo
3. Set these build settings:
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `frontend/dist`
4. Click **Show advanced** → **New variable**
   - Key: `VITE_ANTHROPIC_KEY`
   - Value: `sk-ant-your-key-here`
5. Click **Deploy site**

Done! Every `git push` auto-deploys. 🎉

---

## � Deploy to GitHub Pages

### Automatic Deployment with GitHub Actions

**Step 1** — Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**

**Step 2** — Add Environment Secret (optional, for AI features)
1. In your repo, go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
   - Name: `VITE_ANTHROPIC_KEY`
   - Value: `sk-ant-your-key-here`

**Step 3** — Deploy
- The workflow file `.github/workflows/deploy.yml` is already set up
- Every push to `master` branch will auto-deploy
- Your live URL: `https://YOUR_USERNAME.github.io/Smart_Onboarding` ✅

---

## �🏗️ Project Structure

```
smart-onboarding/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── styles.css      # Modern CSS with dark theme
│   │   └── main.jsx        # React entry point
│   ├── index.html
│   └── package.json
├── mcp-server/               # Model Context Protocol server
│   ├── mcp-server.js        # OpenMetadata API integration
│   └── package.json
├── docker-compose.yml        # OpenMetadata local setup
└── README.md
```

---

## 🎨 UI Improvements

- **Dark Professional Theme**: Modern color palette with Inter and JetBrains Mono fonts
- **Smooth Animations**: CSS transitions and keyframe animations for better UX
- **Responsive Design**: Mobile-friendly layout that works on all devices
- **Interactive Elements**: Hover effects, focus states, and visual feedback
- **Loading States**: Beautiful AI analysis animation with progress indicators
- **Form Validation**: Real-time validation and error handling

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is part of the WeMakeDevs × OpenMetadata Hackathon 2026.

---

## 🙏 Acknowledgments

- [OpenMetadata](https://openmetadata.org) for the amazing data catalog platform
- [Anthropic](https://anthropic.com) for Claude AI
- [WeMakeDevs](https://wemakedevs.org) for organizing the hackathon
- [Model Context Protocol](https://modelcontextprotocol.io) for the integration framework
npm install
npm run build
```

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `frontend/dist` folder into the browser
3. Instant live URL!
4. Add env var: Site Settings → Environment Variables → `VITE_ANTHROPIC_KEY`
5. Trigger redeploy: Deploys → **Trigger deploy**

---

## 📁 Project Structure

```
smart-onboarding/
├── frontend/                 ← React wizard (Vite)
│   ├── src/
│   │   ├── App.jsx           ← Full wizard UI + AI integration
│   │   └── main.jsx          ← Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── mcp-server/               ← MCP server for OpenMetadata writes
│   ├── mcp-server.js         ← 8 MCP tools for OM API
│   └── package.json
├── docker-compose.yml        ← Spins up OpenMetadata locally
└── README.md
```

---

## 🎮 How to Use the Wizard

1. **Enter API Key** — paste your Anthropic key in the banner (or set in .env)
2. **Fill Dataset Info** — table name, platform, paste your schema (CSV or DDL)
3. **Click "Analyze with AI"** — Claude analyzes the schema
4. **Review Suggestions** — edit description, tags, owner, tier, domain
5. **Pick Quality Checks** — toggle which tests to enable
6. **Confirm & Push** — sends the payload to OpenMetadata via MCP

---

## 🛠️ MCP Tools

| Tool | What it does |
|---|---|
| `get_table` | Fetch table metadata by FQN |
| `list_tables` | List all tables |
| `patch_table_description` | Update description |
| `add_tags_to_table` | Apply tags |
| `set_table_owner` | Assign owner |
| `create_quality_test` | Create data quality test |
| `full_onboard_table` | One-shot: apply everything at once |

---

## 🏆 Hackathon Submission Links

- **Live Demo**: `https://your-project.vercel.app`
- **GitHub Repo**: `https://github.com/yourusername/smart-onboarding`
- **Demo Video**: (record a 2-min Loom)
- **Project Board**: https://github.com/orgs/open-metadata/projects/107

---

## 📚 Resources

- [OpenMetadata Docs](https://docs.open-metadata.org)
- [OpenMetadata API](http://localhost:8585/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [MCP SDK](https://modelcontextprotocol.io)
