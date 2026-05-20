# 🃏 Scrum Poker

A real-time multiplayer scrum poker app for agile teams. Create a room, share the code, vote on story points, and reveal estimates together — all from your phone.

## ✨ Features

- **Multiplayer Rooms** — Create or join rooms with a 4-letter code
- **3 Estimation Scales** — Fibonacci, Modified Fibonacci, and T-Shirt sizes
- **Real-Time Voting** — See who has voted without revealing values
- **Instant Reveal** — Host reveals all votes simultaneously
- **Vote Statistics** — Average, min, max, and team agreement percentage
- **Host Controls** — Reveal votes, start new rounds, set topics
- **Auto Host Transfer** — If the host disconnects, the next player takes over
- **Mobile-First Design** — Dark glassmorphism UI optimized for phone screens
- **No Account Required** — Just pick a name and join

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+

### Run Locally

```bash
# Clone the repo
git clone https://github.com/theaob/scrum-poker-app.git
cd scrum-poker-app

# Install dependencies
npm install

# Start the development server (with auto-reload)
npm run dev
```

Open **http://localhost:3000** on your phone or browser.

### Run with Docker

```bash
# Build the image
docker build -t scrum-poker-app .

# Run the container
docker run -p 3000:3000 scrum-poker-app
```

Or pull the pre-built image from Docker Hub:

```bash
docker run -p 3000:3000 <your-dockerhub-username>/scrum-poker-app:latest
```

## 🎮 How to Play

1. **Create a Room** — Pick your name, choose an estimation scale, and create a room
2. **Share the Code** — Give the 4-letter room code to your team (tap it to copy)
3. **Vote** — Everyone selects a card to estimate the story
4. **Reveal** — The host reveals all votes when everyone is ready
5. **Discuss** — Review the results, statistics, and agreement level
6. **Next Round** — The host starts a new round with an optional topic

## 🏗️ Project Structure

```
scrum-poker-app/
├── server.js                          # Express + Socket.IO server
├── package.json
├── Dockerfile
├── .github/workflows/
│   └── docker-publish.yml             # CI/CD pipeline
└── public/
    ├── index.html                     # Single-page app (4 screens)
    ├── css/
    │   └── styles.css                 # Design system & components
    └── js/
        ├── app.js                     # Main app controller
        ├── cards.js                   # Estimation scale definitions
        ├── socket.js                  # Socket.IO client wrapper
        └── ui.js                      # DOM rendering helpers
```

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express, Socket.IO |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Real-Time** | WebSockets (Socket.IO) |
| **State** | In-memory (no database) |
| **Container** | Docker (multi-stage, Alpine) |
| **CI/CD** | GitHub Actions |

## 🔄 CI/CD

The GitHub Actions workflow automatically builds a multi-architecture Docker image (`amd64` + `arm64`) and pushes it to Docker Hub on every push to `main` or version tag (`v*`).

### Setup

Add these secrets to your repository (**Settings → Secrets and variables → Actions**):

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub [access token](https://hub.docker.com/settings/security) |

### Image Tags

| Trigger | Tags Generated |
|---------|---------------|
| Push to `main` | `latest`, `<short-sha>` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `1`, `<short-sha>` |

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |

## 📝 License

MIT
