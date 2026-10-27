# ProjectPulse AI — Backend Service
**Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management**

---

## 1. Overview
ProjectPulse AI bridges the gap between field construction reports and master schedule baselines (L1–L6 WBS). It ingests daily site logs, extracts discrete activities, quantities, units, and dates with strict progress rules, matches them against schedule activities using RapidFuzz (with contextual bonuses and optional semantic similarity), routes candidate links to a Planner Review queue, tracks verified progress without fabricating numbers, manages delays, and maintains project-isolated knowledge bases and audit trails.

---

## 2. Technology Stack
- **Framework**: FastAPI (Python 3.12)
- **Server**: Uvicorn ASGI
- **Data Validation & Settings**: Pydantic v2 & Pydantic-Settings
- **ORM & Database**: SQLAlchemy 2.x with PostgreSQL (with automatic zero-dependency SQLite fallback for local development)
- **Migrations**: Alembic
- **Matching Engine**: RapidFuzz (`token_set_ratio`, `token_sort_ratio`)
- **Document Ingestion**: PyMuPDF (fitz), python-docx, openpyxl, pandas
- **Testing**: pytest & TestClient (18 automated tests passing)

---

## 3. Quick Start (Git Bash / PowerShell)

### Step 1: Navigate to Backend & Activate Virtual Environment
```bash
# In Git Bash
cd /d/vsCode/PROJECTS/Intelligent_Data_Capture/backend
source venv/Scripts/activate

# Or in Windows PowerShell
cd D:\vsCode\PROJECTS\Intelligent_Data_Capture\backend
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
By default, `.env` is configured to run instantly on local SQLite (`DATABASE_URL=sqlite:///./projectpulse.db`).

### Step 4: Run Database Migrations
```bash
alembic upgrade head
```

### Step 5: Start the Backend Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **API Base URL**: `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`
- **Health Check**: `http://127.0.0.1:8000/health`
- **Readiness Check**: `http://127.0.0.1:8000/ready`

---

## 4. PostgreSQL & pgvector Setup (Optional Production DB)

If you have a local or cloud PostgreSQL instance:

1. Create the database:
```sql
CREATE DATABASE projectpulse_db;
```

2. Optional pgvector extension:
```sql
\c projectpulse_db;
CREATE EXTENSION IF NOT EXISTS vector;
```

3. Update `DATABASE_URL` in `backend/.env`:
```ini
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/projectpulse_db
```

4. Apply migrations:
```bash
alembic upgrade head
```

*(Note: If PostgreSQL connection times out or credentials fail, the application logs a warning and automatically falls back to `./projectpulse.db` so the system never crashes).*

---

## 5. Starting the React Frontend
In a separate terminal:
```bash
cd /d/vsCode/PROJECTS/Intelligent_Data_Capture/frontend
npm run dev
```
Open `http://localhost:5173`. Authentication is temporarily bypassed for development; navigating to `/` automatically opens the Project Portfolio at `/projects`.

---

## 6. Running Automated Tests
Run the test suite:
```bash
cd /d/vsCode/PROJECTS/Intelligent_Data_Capture/backend
pytest -v
```
All 18 tests run against an in-memory SQLite database, verifying:
- Health and readiness probes
- Project CRUD, unique code validation, and safe archival
- Multi-project scoping and cross-project 404 isolation
- Staged schedule imports: CSV upload, column mapping, duplicate code checks, hierarchy validation, and commit
- Daily report uploads (TXT, PDF, Word, Excel)
- Deterministic activity extraction and the strict rule: **Quantities are preserved without inventing completion percentages**
- RapidFuzz matching ranking with explanation rationales
- Planner review approval, rejection, reassignments, and clarification requests
- Progress verification and cumulative tracking
- Project terminology CRUD
- Unified search and knowledge retrieval
- Immutable append-only audit trail and CSV export

---

## 7. Implemented API Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/health` | Liveness check |
| | `GET` | `/ready` | Database readiness check |
| **Projects** | `GET` | `/api/v1/projects` | List all projects |
| | `POST` | `/api/v1/projects` | Create a new project |
| | `GET` | `/api/v1/projects/{id}` | Get project details |
| | `PATCH` | `/api/v1/projects/{id}` | Update project metadata |
| | `DELETE` | `/api/v1/projects/{id}` | Archive or delete project |
| | `POST` | `/api/v1/projects/seed-demo` | Reseed demo projects & WBS |
| **Dashboard** | `GET` | `/api/v1/projects/{id}/dashboard` | Database-derived KPIs, trends & distributions |
| **Schedule** | `GET` | `/api/v1/projects/{id}/schedule` | Schedule version summary |
| | `GET` | `/api/v1/projects/{id}/schedule/tree` | Hierarchical L1–L6 WBS tree |
| | `GET` | `/api/v1/projects/{id}/schedule/activities` | List activities with filters |
| | `POST` | `/api/v1/projects/{id}/schedule/activities` | Create activity |
| | `GET` | `/api/v1/projects/{id}/schedule/activities/{act_id}` | Get single activity |
| | `PATCH` | `/api/v1/projects/{id}/schedule/activities/{act_id}` | Update activity & progress |
| **Imports** | `POST` | `/api/v1/projects/{id}/schedule/imports` | Stage 1: Upload CSV/XLSX |
| | `GET` | `/api/v1/projects/{id}/schedule/imports/{imp_id}` | Stage 2: Preview rows & mapping |
| | `POST` | `/api/v1/projects/{id}/schedule/imports/{imp_id}/validate` | Stage 4: Validate hierarchy & duplicates |
| | `POST` | `/api/v1/projects/{id}/schedule/imports/{imp_id}/commit` | Stage 7: Commit schedule revision |
| **Reports** | `GET` | `/api/v1/projects/{id}/reports` | List daily site reports |
| | `POST` | `/api/v1/projects/{id}/reports` | Create direct text report |
| | `GET` | `/api/v1/projects/{id}/reports/{rep_id}` | Get report narrative |
| | `PATCH` | `/api/v1/projects/{id}/reports/{rep_id}` | Update report |
| | `POST` | `/api/v1/projects/{id}/reports/upload` | Upload PDF/DOCX/XLSX/TXT report |
| | `GET` | `/api/v1/projects/{id}/documents` | List uploaded files |
| | `GET` | `/api/v1/projects/{id}/documents/{doc_id}` | View file metadata & extracted text |
| **Extraction** | `POST` | `/api/v1/projects/{id}/reports/{rep_id}/extract` | Deterministic entity extraction |
| | `GET` | `/api/v1/projects/{id}/reports/{rep_id}/events` | List extracted events |
| | `PATCH` | `/api/v1/projects/{id}/events/{ev_id}` | Edit extracted activity or quantity |
| **Matching** | `POST` | `/api/v1/projects/{id}/events/{ev_id}/match` | Compute RapidFuzz candidate scores |
| | `GET` | `/api/v1/projects/{id}/events/{ev_id}/matches` | List persisted candidates |
| | `POST` | `/api/v1/projects/{id}/matching/batch` | Batch match all report events |
| **Reviews** | `GET` | `/api/v1/projects/{id}/reviews` | Planner review queue |
| | `POST` | `/api/v1/projects/{id}/reviews/{rev_id}/approve` | Approve link & record progress |
| | `POST` | `/api/v1/projects/{id}/reviews/{rev_id}/reject` | Reject suggested link |
| | `POST` | `/api/v1/projects/{id}/reviews/{rev_id}/reassign` | Reassign to another activity |
| | `POST` | `/api/v1/projects/{id}/reviews/{rev_id}/request-context` | Request clarification |
| **Progress** | `GET` | `/api/v1/projects/{id}/progress` | List verified progress logs |
| | `GET` | `/api/v1/projects/{id}/progress/activities/{act_id}` | Activity cumulative progress |
| | `POST` | `/api/v1/projects/{id}/progress/records` | Record verified physical quantity |
| **Delays** | `GET` | `/api/v1/projects/{id}/delays` | List delays & critical path impacts |
| | `POST` | `/api/v1/projects/{id}/delays` | Log new delay event |
| | `PATCH` | `/api/v1/projects/{id}/delays/{del_id}` | Update mitigation plan |
| | `POST` | `/api/v1/projects/{id}/delays/{del_id}/close` | Close delay as mitigated |
| **Knowledge** | `GET` | `/api/v1/projects/{id}/knowledge-base` | List technical documents |
| | `POST` | `/api/v1/projects/{id}/knowledge-base/documents` | Add document and chunk index |
| | `POST` | `/api/v1/projects/{id}/knowledge-base/search` | Project-scoped text search fallback |
| **Terminology**| `GET` | `/api/v1/projects/{id}/terminology` | List site aliases and terms |
| | `POST` | `/api/v1/projects/{id}/terminology` | Register verified term |
| | `PATCH` | `/api/v1/projects/{id}/terminology/{term_id}` | Update term |
| | `DELETE` | `/api/v1/projects/{id}/terminology/{term_id}` | Delete term |
| **Audit** | `GET` | `/api/v1/projects/{id}/audit` | Immutable append-only audit trail |
| | `GET` | `/api/v1/projects/{id}/audit/export` | Export audit trail as CSV |
| **Settings** | `GET` | `/api/v1/projects/{id}/settings` | Get matching thresholds |
| | `PATCH` | `/api/v1/projects/{id}/settings` | Update thresholds & alerts |
| **Search** | `GET` | `/api/v1/projects/{id}/search?q=...` | Unified multi-entity search |

---

## 8. Current Limitations & Deferred Authentication
- **Authentication Bypass**: In accordance with project instructions, authentication guards, JWT validation, and registration have been temporarily bypassed for development. This application is currently not secured for production deployment until authentication is re-enabled.
- **Semantic Models**: Sentence-Transformers and cloud LLM integrations are configurable via environment variables (`SENTENCE_TRANSFORMERS_MODEL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) and are not downloaded on startup. When unconfigured, deterministic RapidFuzz token matching and text BM25 fallback operate with zero external dependencies.
