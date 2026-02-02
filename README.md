# GBMM Mission Control

Apple-inspired task management dashboard for Green Beans Media Management.

## Features

### Core
- **Kanban Board** - Drag & drop task management across 5 columns
- **Spreadsheet List View** - Sortable table with all task details
- **Calendar View** - Month/Week/Day views with task names visible
- **Smart Filters** - Single-select filters by assignee, project, priority
- **Real-time Stats** - Active tasks, overdue items, progress tracking
- **Dark/Light Theme** - Toggle between themes

### Productivity (Inspired by Linear & Top GitHub Apps)
- **Quick Actions** - Hover over tasks for instant complete/delete (Linear-style)
- **Quick Add** - Press `Cmd/Ctrl+K` to instantly create tasks
- **Debounced Search** - Smooth, efficient search (300ms debounce)
- **Auto-save** - Changes save automatically every 30 seconds + on edit
- **Optimistic UI** - Instant visual updates before backend confirms
- **Keyboard Shortcuts** - Fast navigation (N, /, Esc, ?)
- **LocalStorage Backup** - Offline-first, syncs when online

### Data & Backend
- **File Persistence** - Data saves to `data.json` via Express backend
- **API Endpoints** - `/api/data` (GET/POST), `/api/export`
- **Export/Import** - Backup your data anytime

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/lndjarvis1-ops/gbmm-mission-control.git
   cd gbmm-mission-control
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   ```
   http://localhost:8080
   ```

### Alternative (no backend):
If you just want to try it without the backend:
```bash
python3 -m http.server 8080
```
(Note: Data won't persist to file without the Node.js backend)

## Tech Stack

- Vanilla JavaScript (no frameworks)
- HTML5 + CSS3
- LocalStorage for persistence
- Native drag & drop API

## Keyboard Shortcuts

- `N` - New task
- `/` - Focus search
- `Esc` - Close modal/sidebar
- `?` - Show all shortcuts

## Data Structure

Tasks are stored in `data.json` with the following schema:

```json
{
  "id": "unique-id",
  "title": "Task name",
  "project": "Project name",
  "status": "backlog|todo|doing|review|done",
  "priority": "p0|p1|p2|p3",
  "assignee": "Name",
  "deadline": "YYYY-MM-DD",
  "effort": "small|medium|large",
  "progress": 0-100,
  "nextAction": "text",
  "notes": ""
}
```

## License

MIT

## Author

Built for GBMM by Harry (OpenClaw)
