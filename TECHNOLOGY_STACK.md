# ProcessX - Technology Stack Specification

**Version:** 1.0
**Date:** November 28, 2025
**Status:** Approved for Implementation

---

## Technology Stack - Final Specification

This document represents the approved and finalized technology stack for ProcessX implementation.

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI framework |
| TypeScript | 5+ | Type safety |
| Vite | 5+ | Build tool and dev server |
| ReactFlow | 11+ | Process diagram visualization |
| Zustand | 4+ | Client state management |
| TanStack Query | 5+ | Server state management |
| Tailwind CSS | 3+ | Styling framework |
| shadcn/ui | Latest | UI component library |
| Recharts | 2+ | Data visualization |
| React Router | 6+ | Routing |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime environment |
| Express | 4+ | Web framework |
| TypeScript | 5+ | Type safety |
| Prisma | 5+ | ORM |
| PostgreSQL | 15+ | Primary database |
| Passport.js | 0.7+ | Authentication |
| jsonwebtoken | 9+ | JWT tokens |
| bcrypt | 5+ | Password hashing |
| helmet | 7+ | Security headers |
| express-rate-limit | 7+ | Rate limiting |
| Zod | 3+ | Schema validation |

### AI Integration

| Provider | Model | Purpose |
|----------|-------|---------|
| Anthropic | Claude Sonnet 4.5 | Primary analysis, recommendations |
| Google | Gemini 2.0 Flash/Pro | Visual analysis, document import |
| OpenAI | GPT-4o | Natural language generation |
| Groq | Llama 3.1 | Real-time features, privacy |

### Export Generation

| Library | Purpose |
|---------|---------|
| PptxGenJS | PowerPoint generation |
| PDFKit | PDF generation |
| ExcelJS | Excel spreadsheet generation |
| docx | Word document generation |

### Development Tools

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Docker Compose | Local development environment |
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing (frontend) |
| Jest | Unit testing (backend) |
| Playwright | E2E testing |
| GitHub Actions | CI/CD |

### Infrastructure (Initial)

| Service | Purpose |
|---------|---------|
| Local Development | Docker Compose |
| Version Control | Git + GitHub |
| Database | PostgreSQL (local, then cloud) |
| File Storage | Local (then S3/Azure) |

---

## Project Structure

```
ProcessX/
├── frontend/                 # React application
├── backend/                  # Node.js API
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Local development setup
└── README.md                 # Project readme
```

---

**Approved by:** Pascal
**Implementation Start Date:** November 28, 2025
