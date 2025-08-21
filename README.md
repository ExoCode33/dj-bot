# Uta DJ — Discord Music Bot

- One slash command `/uta` opens a Uta-themed panel
- Buttons: Queue (modal), Play/Pause, Skip
- Accepts YouTube + Spotify links (via Lavalink + lavasrc)
- Role-gated via `AUTHORIZED_ROLE_ID`

## Setup

1. Copy `.env.example` → `.env` (local) and fill values.
2. Deploy `lavalink-service/` on Railway.
3. Deploy `uta-dj-bot/` on Railway.
4. Set Variables in Railway (same keys as `.env.example`).
