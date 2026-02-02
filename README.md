# GBMM Mission Control

Apple-inspired task management dashboard for Green Beans Media Management.

## Features

- **Kanban Board** - Drag & drop task management across 5 columns
- **List View** - Tasks grouped by project with sortable columns
- **Calendar View** - Month/Week/Day views with task scheduling
- **Smart Filters** - Filter by assignee, project, priority
- **Real-time Stats** - Active tasks, overdue items, progress tracking
- **Dark/Light Theme** - Toggle between themes
- **Keyboard Shortcuts** - Fast navigation (N for new task, / for search)

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd mission-control
   ```

2. **Serve locally:**
   ```bash
   python3 -m http.server 8080
   ```

3. **Open in browser:**
   ```
   http://localhost:8080
   ```

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
