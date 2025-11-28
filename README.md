# ProcessX - Insurance Process Optimization Platform

> An AI-powered web application for simplifying process mapping, pain point analysis, and target process definition in the insurance sector.

[![Status](https://img.shields.io/badge/status-in--development-yellow.svg)]()
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)]()

## 🚀 Quick Start

**Get started in 5 minutes:**

```bash
# 1. Start database services
docker-compose up -d

# 2. Set up and start backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# 3. Set up and start frontend (in new terminal)
cd frontend && npm install && npm run dev
```

**📖 Detailed Setup:** See [SETUP.md](./SETUP.md) for complete installation instructions.

---

## 📋 Project Overview

ProcessX is a comprehensive web-based platform designed to streamline process optimization in the insurance sector. The application enables insurance professionals to:

1. **Visualize As-Is Processes** - Interactive process mapping with drag-and-drop interface
2. **Identify Pain Points** - AI-powered detection of bottlenecks, inefficiencies, and risks
3. **Generate Optimized Processes** - Receive intelligent recommendations for process improvements based on industry best practices

---

## 🎯 Key Features

### Process Mapping & Visualization
- Drag-and-drop visual process builder
- Multiple view modes (flowchart, swimlane, timeline)
- Pre-built insurance process templates
- Detailed process step metadata capture

### AI-Powered Pain Point Analysis
- Automated bottleneck detection
- Manual pain point flagging with categorization
- Root cause analysis suggestions
- Priority scoring and impact assessment

### Target Process Recommendations
- AI-generated optimization suggestions
- Before/after process comparison
- ROI and impact analysis
- Implementation roadmap generation
- Insurance industry best practices integration

### Multi-Format Export
- **PowerPoint (.pptx)** - Professional presentation decks
- **PDF** - Comprehensive documentation
- **Excel (.xlsx)** - Detailed process inventories and trackers
- **Word (.docx)** - SOP documentation
- **Images (PNG/SVG)** - High-resolution diagrams
- **JSON** - Data export for integrations

---

## 📚 Documentation

This repository contains comprehensive project documentation:

### Main Documents

| Document | Markdown | PDF | Description |
|----------|----------|-----|-------------|
| **Project Proposal** | [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) | [PROJECT_PROPOSAL.pdf](./PROJECT_PROPOSAL.pdf) | Complete project specification including features, architecture, technology stack, implementation roadmap, and cost estimates |
| **Competitive Analysis & AI Strategy** | [COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.md](./COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.md) | [COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.pdf](./COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.pdf) | Market analysis, competitor comparison, and detailed AI integration strategy with multi-model approach |

---

## 🏗️ Technology Stack

### Frontend
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **ReactFlow** - Process diagram visualization
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library
- **Vite** - Build tool

### Backend
- **Node.js 20+** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database

### AI Integration
- **Claude API (Anthropic)** - Primary analysis engine
- **Gemini 2.0 (Google)** - Multimodal analysis (visual, documents)
- **GPT-4o (OpenAI)** - Natural language generation
- **Llama 3.1 (Groq/Self-hosted)** - Real-time features, privacy

### Export Generation
- **PptxGenJS** - PowerPoint generation
- **PDFKit** - PDF creation
- **ExcelJS** - Excel workbooks
- **html-docx-js** - Word documents

---

## 🚀 Implementation Roadmap

### Phase 1: MVP (8-10 weeks)
- ✅ User authentication
- ✅ Process mapping and visualization
- ✅ Manual pain point tracking
- ✅ Basic export (PNG, PDF, PowerPoint)
- ✅ Process library management

**Target:** Functional product for early adopters

### Phase 2: AI-Powered Analysis (6-8 weeks)
- ✅ AI pain point detection
- ✅ Optimization recommendations
- ✅ Impact and ROI analysis
- ✅ Before/after comparison
- ✅ Enhanced exports with AI insights

**Target:** Differentiated AI capabilities

### Phase 3: Advanced Features (6-8 weeks)
- ✅ Process template library
- ✅ Collaboration and commenting
- ✅ Advanced analytics dashboard
- ✅ All export formats
- ✅ API for integrations

**Target:** Enterprise-ready platform

### Phase 4: Enterprise & Scale (Ongoing)
- Multi-tenancy
- Advanced security
- Mobile app
- Enterprise integrations
- White-labeling

---

## 💡 Competitive Advantages

### 1. Insurance-Specific Focus
Unlike generic BPM tools, ProcessX is built specifically for insurance with:
- Pre-built templates for claims, underwriting, policy admin
- Insurance regulatory compliance frameworks
- Industry-specific pain point detection
- Sector benchmarks and best practices

### 2. AI-Powered Intelligence
Most competitors have NO AI or very limited AI capabilities. ProcessX offers:
- Multi-model AI approach (Claude, Gemini, GPT-4, Llama)
- Automated pain point detection
- Intelligent optimization recommendations
- Natural language process queries
- Document and diagram analysis

### 3. Comprehensive Export Ecosystem
While competitors offer basic image/PDF exports, ProcessX provides:
- Professional PowerPoint presentations with branding
- Detailed Excel workbooks with ROI calculators
- Word documentation for SOPs
- Multiple image formats
- Data exports for integrations

### 4. Rapid Time-to-Value
- Up and running in 1-2 weeks (vs. 3-12 months for enterprise BPM)
- Intuitive interface requiring minimal training
- Immediate AI insights
- No consultants required

### 5. Affordable Pricing
- SMB-friendly pricing ($50-500/month range)
- No long-term contracts
- Transparent, usage-based pricing
- Free tier for small teams

**Cost Comparison:**
- Enterprise BPM (Signavio, Celonis): $50K-$500K+ annually
- ProcessX: $600-$6,000 annually
- **Savings: 80-95%**

---

## 🏆 Competitor Comparison

| Feature | ProcessX | Signavio | Lucidchart | Celonis | Bizagi |
|---------|----------|----------|------------|---------|--------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **AI Pain Point Detection** | ✅ | ❌ | ❌ | ⚠️ Limited | ❌ |
| **AI Recommendations** | ✅ | ❌ | ❌ | ⚠️ Limited | ❌ |
| **Insurance-Specific** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Advanced PowerPoint Export** | ✅ | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic |
| **Excel Export (Detailed)** | ✅ | ⚠️ Basic | ❌ | ✅ | ⚠️ Basic |
| **Before/After Comparison** | ✅ | ⚠️ Manual | ❌ | ✅ | ⚠️ Manual |
| **Implementation Time** | 1-2 weeks | 3-6 months | 1 week | 6-12 months | 1-3 months |
| **Pricing** | $$ | $$$$$+ | $$ | $$$$$+ | $$$$ |

**Legend:** ✅ Full feature, ⚠️ Limited, ❌ Not available

---

## 🤖 AI Strategy Overview

### Multi-Model Approach

ProcessX uses multiple AI models, each optimized for specific tasks:

#### Claude Sonnet 4.5 (Anthropic) - Primary Analysis Engine
**Use Cases:**
- Pain point detection and analysis
- Optimization recommendations
- Root cause analysis
- Compliance gap detection
- Strategic decision support

**Why:** Best reasoning, reliable structured output, excellent for business analysis

#### Gemini 2.0 (Google) - Multimodal Analysis
**Use Cases:**
- Visual process diagram analysis
- Document import (PDFs, screenshots)
- OCR and data extraction
- Industry report analysis

**Why:** Excellent multimodal capabilities, cost-effective, large context window

#### GPT-4o (OpenAI) - Natural Language Generation
**Use Cases:**
- User-friendly explanations
- Report generation
- Executive summaries
- Customer-facing content

**Why:** Best natural language generation, compelling narratives

#### Llama 3.1 (Groq/Self-hosted) - Real-time & Privacy
**Use Cases:**
- Real-time suggestions and auto-complete
- Sensitive data processing
- High-volume, low-complexity tasks
- Cost-sensitive operations

**Why:** Ultra-fast (via Groq), privacy control, cost-effective

### Cost Optimization

**Intelligent Model Routing:**
- 70% of requests → Cheap models (Gemini Flash, Groq Llama): ~$0.10 per 1M tokens
- 20% of requests → Balanced models (GPT-4o): ~$3 per 1M tokens
- 10% of requests → Premium models (Claude): ~$10 per 1M tokens

**Savings:** 60-70% vs. using only premium models

**Example Monthly Cost:**
- 10,000 AI requests
- Without routing (all Claude): $500/month
- With routing: $150/month
- **Savings: $350/month (70%)**

---

## 📊 Success Metrics

### User Engagement
- Number of processes created
- Active users (DAU/MAU)
- Processes per user
- Template usage rate

### Feature Adoption
- AI analysis usage rate
- Recommendation acceptance rate
- Export generation frequency
- Collaboration feature usage

### Business Impact
- Time saved per process optimization
- Number of pain points identified
- Recommendations implemented
- User satisfaction (NPS/CSAT)
- Customer retention rate

### Technical Performance
- Page load time < 2 seconds
- API response time < 500ms
- Export generation time < 30 seconds
- System uptime > 99.5%
- Error rate < 1%

---

## 💰 Cost Estimates

### Development (Internal Team)
- **Phase 1 (MVP):** 12-15 person-weeks
- **Phase 2:** 6-8 person-weeks
- **Phase 3:** 8-10 person-weeks
- **Total:** ~26-33 person-weeks

### Infrastructure (Monthly)

**Starter Tier (< 100 users):**
- Hosting: $50-100
- Database: $30-50
- Storage: $10-20
- AI APIs: $50-200
- **Total: $150-380/month**

**Growth Tier (100-1000 users):**
- Hosting: $200-400
- Database: $100-200
- Storage: $50-100
- AI APIs: $200-1000
- CDN: $50
- Monitoring: $50
- **Total: $650-1800/month**

---

## 🔒 Security & Compliance

### Data Protection
- Encryption at rest and in transit
- bcrypt password hashing
- JWT authentication with refresh tokens
- Regular security audits

### Access Control
- Role-based access control (RBAC)
- Multi-tenancy with data isolation
- Audit logging for all actions
- 2FA support

### Compliance
- GDPR compliance (EU data privacy)
- CCPA compliance (California privacy)
- SOC 2 Type II (planned)
- Insurance industry standards

### AI Data Privacy
- **Claude:** Does not train on user data
- **Gemini:** Vertex AI with enterprise controls
- **Self-hosted Llama:** Complete data control for sensitive processes

---

## 📁 Project Structure (Planned)

```
processx/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── features/         # Feature modules
│   │   │   ├── process-builder/
│   │   │   ├── pain-points/
│   │   │   ├── recommendations/
│   │   │   └── exports/
│   │   ├── services/         # API clients
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Utilities
│   └── package.json
│
├── backend/                  # Node.js application
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   │   ├── ai/           # AI service layer
│   │   │   ├── export/       # Export generation
│   │   │   └── process/      # Process management
│   │   ├── models/           # Database models (Prisma)
│   │   ├── middleware/       # Express middleware
│   │   └── utils/            # Utilities
│   ├── prisma/               # Database schema
│   └── package.json
│
├── docs/                     # Documentation
│   ├── api/                  # API documentation
│   ├── user-guide/           # User guides
│   └── architecture/         # Architecture docs
│
├── scripts/                  # Utility scripts
└── docker-compose.yml        # Local development setup
```

---

## 🚦 Getting Started (Future)

Once development begins, the setup process will be:

```bash
# Clone repository
git clone https://github.com/your-org/processx.git
cd processx

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:setup

# Run development servers
npm run dev

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

---

## 📖 Documentation Index

### For Business Stakeholders
- [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) - Complete project overview
- [COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.md](./COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.md) - Market analysis

### For Technical Team
- [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) - See sections:
  - Technical Architecture
  - Technology Stack
  - Database Schema
  - API Endpoints
- [COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.md](./COMPETITIVE_ANALYSIS_AND_AI_STRATEGY.md) - See sections:
  - AI Implementation Details
  - Multi-Model Strategy
  - Code Examples

### For Investors/Executives
- Both PDFs provide print-ready versions
- Executive Summary in PROJECT_PROPOSAL.md
- Competitive Advantages in both documents

---

## 🤝 Contributing (Future)

Once the project is in active development:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

TBD - To be determined based on business model

---

## 📞 Contact

**Project Lead:** Pascal
**Project Repository:** /home/pascal/Software/ProcessX

---

## 🗺️ Next Steps

1. ✅ Review and approve project proposal
2. ✅ Review competitive analysis and AI strategy
3. ⏳ Finalize technology stack decisions
4. ⏳ Assemble development team
5. ⏳ Set up development environment
6. ⏳ Begin Phase 1 (MVP) implementation

---

## 📊 Current Status

**Status:** Planning & Documentation Phase
**Version:** 1.0.0
**Last Updated:** November 28, 2025

### Completed Deliverables

✅ Comprehensive project proposal (Markdown + PDF)
✅ Competitive analysis with detailed feature comparison
✅ AI strategy with multi-model approach
✅ Technology stack recommendation with rationale
✅ Database schema design
✅ API endpoint specification
✅ Implementation roadmap (4 phases)
✅ Cost estimates (development + infrastructure)
✅ Risk assessment and mitigation strategies

### Next Phase

Ready to begin **Phase 1: MVP Development** upon approval and team assembly.

---

**Built with ❤️ for the insurance industry**
