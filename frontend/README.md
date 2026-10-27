# ProjectPulse AI — Intelligent Data Capture & Schedule-Linking Layer

An enterprise SaaS frontend for infrastructure project management that transforms daily field reports into verified schedule progress with AI-powered activity matching and human-in-the-loop validation.

---

## Tech Stack
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **Data Visualization**: Recharts (S-Curves, Donut distribution, Comparative bar charts)
- **HTTP Client**: Axios (configured with base URL and interceptors)
- **State Management**: React Context (`ProjectContext`) with session persistence

---

## Getting Started

### Prerequisites
Node.js 18+ and npm installed.

### Installation & Local Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. Build for production:
   ```bash
   npm run build
   ```

---

## Routes & Screens

| Route | Screen Name | Description |
|---|---|---|
| `/login` | **Demo Authentication** | Clean enterprise login screen supporting instant demo sign-in |
| `/projects` | **My Projects** | Multi-project catalog with search, status filters, and project creator |
| `/projects/:projectId/dashboard` | **Project Dashboard** | Progress KPIs, Planned vs. Actual S-Curve, status distribution, discipline charts, attention items |
| `/projects/:projectId/setup` | **Project Setup** | L1–L6 WBS hierarchy tiers, terminology dictionary, and AI confidence calibration |
| `/projects/:projectId/schedule` | **Schedule Explorer** | Searchable L1–L6 hierarchy tree, filterable activities table, and slide-over detail drawer |
| `/projects/:projectId/schedule/upload` | **Schedule Upload** | 4-step wizard: file selection (.xer, .xml, .xlsx, .csv), column mapping, validation, and sync |
| `/projects/:projectId/reports` | **Daily Reports** | Intake via direct site diary text or document upload with exact demo report narrative |
| `/projects/:projectId/reports/:reportId` | **Report Details** | Split view: raw field narrative on left, structured entities on right |
| `/projects/:projectId/ai/extraction` | **AI Extraction Workbench** | Inspect and edit structured construction events (Event Type, Quantity, Location, "Not specified" progress) |
| `/projects/:projectId/ai/matching` | **Activity Schedule Matcher** | Top ranked L5/L6 candidates with fuzzy lexical ratio, semantic embedding score, and rationale |
| `/projects/:projectId/reviews` | **Planner Validation Queue** | Interactive queue for planners to Approve, Edit & Reassign, Request Context, or Reject matches |
| `/projects/:projectId/progress` | **Progress & EVM Tracking** | Cumulative S-Curves, physical completion %, Schedule Variance (SV), SPI, and milestone tracking |
| `/projects/:projectId/delays` | **Delay & Variance Analysis** | Root cause breakdown, critical path impact (+14d), and mitigation plan logger |
| `/projects/:projectId/knowledge-base` | **Knowledge Base** | Installation verification protocols, standard specs, and lessons learned |
| `/projects/:projectId/audit` | **Audit Trail** | Immutable audit log of approvals, overrides, schedule imports, and field uploads with CSV export |
| `/projects/:projectId/settings` | **Project Settings** | Metadata editor, AI matching threshold sliders, notification preferences, and demo reset |

---

## Multi-Project Isolation
Three isolated demonstration projects are included:
1. **ABC Refinery Expansion** (`proj-001`): Houston, TX — 2,430 activities, 34% complete.
2. **North Plant Pipeline Project** (`proj-002`): Edmonton, AB — 1,240 activities, 58% complete.
3. **Central Utilities Upgrade** (`proj-003`): Jubail, Saudi Arabia — 1,850 activities, 8% complete.

Switching projects via the top navigation bar or project cards updates the active schedule, daily reports, AI matching candidates, delays, terminology, and audit history.

---

## Demo Schedule Hierarchy & Report
- **Hierarchy**:
  - `L1`: ABC Refinery Expansion
  - `L2`: Process Plant
  - `L3`: Piping
  - `L4`: Above Ground Piping
  - `L5`: Carbon Steel Pipeline Installation
  - `L6-101`: Install 10-inch CS Pipeline — Unit A (55%, 450 m)
  - `L6-102`: Install 12-inch CS Pipeline — Unit B (30%, 620 m, +14d delay)
  - `L6-103`: Install 8-inch CS Pipeline — Unit C (0%, 380 m)
- **Demo Report Narrative**:
  > *"Today the piping crew started installation of the 10-inch carbon steel pipeline in Unit A. Approximately 30 meters were installed."*
  - Extracted: Activity: `10-inch carbon steel pipeline installation`, Discipline: `Piping`, Location: `Unit A`, Quantity: `30 meters`, Progress: `Not specified`.
  - Matched Target: `L6-101` with 95% confidence (94% fuzzy, 96% semantic).
