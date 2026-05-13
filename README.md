# PulseDeck — Visual Workflow Builder

A browser-based visual workflow editor: place steps on a canvas, connect them, configure parameters, save/validate/run against an API.

An alternative to fragile spreadsheet logic — the graph *is* the spec: steps, order, and parameters are explicit, versionable (JSON export), and executable by a backend.

![PulseDeck](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/React-18-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)
[![CI](https://github.com/melvincarassco/pulsedeck/actions/workflows/ci.yml/badge.svg)](https://github.com/melvincarassco/pulsedeck/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

### Frontend
- **Visual Canvas** — React Flow-based horizontal pipeline with snap-to-grid, minimap, and zoom controls
- **Step Library** — 15+ step types across 5 categories (Messaging, Logic, Data, Integration, Control)
- **Channel Context** — WhatsApp / RCS / SMS filtering for messaging steps
- **Auto-Chaining** — New nodes automatically connect to the previous step
- **Node Config** — Click any node to edit its label, type, and key/value parameters
- **Workflow Config** — Separate "Configuration" tab for workflow-level parameters
- **Import/Export** — Download/upload workflow JSON for versioning and sharing
- **Templates** — 3 built-in starter templates
- **Open from Server** — Browse and load saved workflows
- **Undo/Redo** — Full history stack
- **Keyboard Shortcuts** — `?`, `L`, `Ctrl+Z`, `Ctrl+S`, `Ctrl+E`, `Delete`
- **Execution Panel** — Run workflows, view live logs, per-node success/fail indicators

### Backend (FastAPI)
- **7 REST Endpoints** — CRUD, validate, run, execution logs
- **In-Memory MVP** — No database needed; resets on restart
- **Simulated Execution** — Sequential step processing with log output
- **Auto-Docs** — Swagger UI at `/docs`

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Canvas | @xyflow/react (React Flow) |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| Backend | Python FastAPI |
| API | RESTful JSON |

## 🚀 Quick Start

### Docker (Recommended)
The easiest way to run the entire stack is with Docker:
```bash
docker compose up
```
- **Frontend**: http://localhost:5180
- **Backend API Docs**: http://localhost:8000/docs

### Manual Setup - Frontend
```bash
cd workflow-builder
npm install
npm run dev
# → http://localhost:5180
```

### Backend
```bash
cd workflow-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
# → http://localhost:8000/docs
```

## 📦 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/workflows` | Create workflow |
| GET | `/workflows` | List workflows |
| GET | `/workflows/{id}` | Get workflow |
| PUT | `/workflows/{id}` | Update workflow |
| POST | `/workflows/{id}/validate` | Validate graph |
| POST | `/workflows/{id}/run` | Run workflow |
| GET | `/executions/{id}` | Get execution record |

## 📁 Project Structure

```
pulsedeck/
├── workflow-builder/     # React frontend
│   └── src/
│       ├── components/   # Canvas, Toolbar, ConfigPanel, ExecutionPanel, Modals, Layout
│       ├── store/        # Zustand stores (workflow, execution, UI)
│       └── utils/        # API client, step definitions, templates
└── workflow-api/         # FastAPI backend
    └── main.py           # All endpoints + simulated execution
```

## 💡 One-Line Pitch

> "Spreadsheets encode fragile business flow in cells; PulseDeck encodes the same flow as an explicit, runnable graph + API — better for automation, audit, and handoff to engineering."

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started, and our [Code of Conduct](CODE_OF_CONDUCT.md) for community guidelines.

## 📝 License

MIT
