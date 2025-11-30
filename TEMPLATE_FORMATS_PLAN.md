# ProcessX: AI Generation, Templates, Exports & BPMN Implementation Plan

## Overview

This document outlines the implementation plan for four major feature enhancements to ProcessX:
1. AI Process Generation from Natural Language Description
2. Insurance/Underwriting Process Template Library
3. Analysis/Recommendations Export to Multiple Formats
4. BPMN Import/Export Standard Format Support

## Phase 1: AI Process Generation from Description

**Estimated Effort**: 4-5 hours
**Priority**: HIGH
**Infrastructure Readiness**: 85% (leverages existing AI pipeline)

### Backend Changes

#### 1. Extend AI Service (`/backend/src/services/ai.service.ts`)
- Add new method: `generateProcessFromDescription()`
  - Input: organizationId, description (string), processType ('AS_IS' | 'TO_BE')
  - Uses existing AI provider infrastructure
  - Specialized prompt for insurance domain
  - Returns: { name, description, steps[], connections[] }

#### 2. New Controller (`/backend/src/controllers/ai-generation.controller.ts`)
- `POST /api/processes/generate-from-description`
  - Validates input (Zod schema)
  - Calls AI service
  - Optionally creates process immediately or returns preview
  - Returns structured process data

#### 3. Add Route (`/backend/src/routes/ai-generation.routes.ts`)
- Register new endpoint
- Apply authentication middleware
- Import in main index.ts

### Frontend Changes

#### 1. Generation Modal Component (`/frontend/src/components/ProcessGenerationModal.tsx`)
- Textarea for natural language description (min 50 chars)
- Process type selector (AS_IS / TO_BE)
- Industry context selector (Insurance, Banking, Healthcare, etc.)
- Preview generated process structure
- "Generate" and "Create Process" buttons
- Loading state with AI provider indication

#### 2. Update Processes Page (`/frontend/src/pages/Processes.tsx`)
- Add "Generate with AI" button next to "New Process"
- Opens ProcessGenerationModal
- Refreshes list after successful generation

#### 3. API Client (`/frontend/src/lib/api.ts`)
- Add `generateProcessFromDescription()` method
- Type definitions for generation request/response

### Example Prompts
```
Insurance Claims Processing:
"Create a process for handling auto insurance claims from initial report through settlement, including validation, investigation, and payment steps."

Underwriting Workflow:
"Map the commercial property underwriting process including risk assessment, pricing, approval workflow, and policy issuance."
```

## Phase 2: Insurance Process Template Library

**Estimated Effort**: 3-4 hours
**Priority**: HIGH
**Infrastructure Readiness**: 60% (schema exists, no implementation)

### Backend Changes

#### 1. Template Controller (`/backend/src/controllers/template.controller.ts`)
- `GET /api/templates` - List all templates (public + org-specific)
- `GET /api/templates/:id` - Get template details
- `POST /api/templates` - Create custom template (admin only)
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/use` - Create process from template

#### 2. Template Routes (`/backend/src/routes/template.routes.ts`)
- Register CRUD endpoints
- Apply authentication
- Role-based access for creation/deletion

#### 3. Seed Templates (`/backend/prisma/seed-templates.ts`)
Create 8-10 insurance process templates:
1. **Auto Claims Processing** - Claim intake → Investigation → Settlement
2. **Commercial Underwriting** - Application → Risk assessment → Pricing → Approval
3. **Personal Lines Underwriting** - Quote → Bind → Issue policy
4. **Policy Renewal** - Renewal notice → Re-underwriting → Premium calculation
5. **Customer Onboarding** - Application → KYC → Account setup → Welcome
6. **Premium Collection** - Invoice → Payment processing → Reconciliation
7. **Policy Cancellation** - Request → Validation → Refund calculation → Confirmation
8. **Reinsurance Placement** - Treaty negotiation → Placement → Contract management

Each template includes:
- Complete process structure (8-12 steps)
- Connections between steps
- Metadata (responsible roles, typical duration)
- Category tags
- Preview description

#### 4. Update Prisma Seed (`/backend/prisma/seed.ts`)
- Import and run template seeding
- Add to main seed script

### Frontend Changes

#### 1. Template Gallery Component (`/frontend/src/components/TemplateGallery.tsx`)
- Grid/list view of templates
- Category filters (Claims, Underwriting, Policy, Onboarding, etc.)
- Search by name/description
- Template preview cards with:
  - Template name
  - Description
  - Step count
  - Category badge
  - Usage count
  - "Use Template" button

#### 2. Template Detail Modal (`/frontend/src/components/TemplateDetailModal.tsx`)
- Full template description
- Visual preview of process flow
- List of steps and connections
- "Use This Template" primary action
- Customization options (name, description)

#### 3. Update Processes Page
- Add "Browse Templates" button
- Opens TemplateGallery in modal
- Creates process from template selection

#### 4. API Client Updates
- Add template endpoints (list, get, use)
- Type definitions for Template interface

## Phase 3: Analysis/Recommendations Export to Multiple Formats

**Estimated Effort**: 2-3 hours
**Priority**: MEDIUM
**Infrastructure Readiness**: 70% (process export exists, needs adaptation)

### Backend Changes

#### 1. Extend Export Controller (`/backend/src/controllers/export.controller.ts`)

Add new endpoints:
- `GET /api/analyses/:id/export/markdown` - Analysis as .md
- `GET /api/analyses/:id/export/excel` - Analysis as .xlsx
- `GET /api/analyses/:id/export/powerpoint` - Analysis as .pptx
- `GET /api/analyses/:id/export/word` - Analysis as .docx
- `GET /api/analyses/:id/export/pdf` - Analysis as .pdf

Each export includes:
- Process understanding summary
- Detected pain points table (category, severity, title, description, impact)
- Recommendations table (category, priority, title, benefits, implementation steps)
- TO-BE process structure (if generated)
- Analysis metadata (date, AI provider, tokens used)

#### 2. Export Format Implementations

**Markdown Export** (NEW):
```markdown
# Process Analysis Report
## Process: [Name]
Analysis Date: [Date]
AI Provider: [Provider]

## Understanding
[AI's understanding of the process]

## Pain Points Detected
| Category | Severity | Title | Description | Impact |
|----------|----------|-------|-------------|--------|
| ...      | ...      | ...   | ...         | ...    |

## Recommendations
### High Priority
- **[Title]** - [Description]
  - Benefits: [...]
  - Implementation: [...]

## TO-BE Process
[Generated process structure if available]
```

**Excel Export** (Adapt existing):
- Sheet 1: Analysis Summary
- Sheet 2: Pain Points (sortable, filterable)
- Sheet 3: Recommendations
- Sheet 4: TO-BE Process Steps

**PowerPoint Export** (Adapt existing):
- Slide 1: Title slide with process name
- Slide 2: Executive summary
- Slide 3-4: Pain points breakdown
- Slide 5-6: Recommendations with implementation roadmap
- Slide 7: TO-BE process visualization

**Word Export** (Adapt existing):
- Professional report format
- Table of contents
- Sections for each component
- Charts and tables

**PDF Export** (Adapt existing):
- Same as Word but in PDF format
- Page numbers, headers, footers

#### 3. Update Export Routes (`/backend/src/routes/export.routes.ts`)
- Add analysis export endpoints
- Apply authentication middleware

### Frontend Changes

#### 1. Update Process Analyze Page (`/frontend/src/pages/ProcessAnalyze.tsx`)
- Add "Export Analysis" dropdown button
- Options: Markdown, Excel, PowerPoint, Word, PDF
- Download handling for each format
- Loading state during export generation

#### 2. API Client Updates
- Add export methods for each format
- Handle blob responses for downloads

## Phase 4: BPMN Import/Export Standard Format

**Estimated Effort**: 5-6 hours
**Priority**: MEDIUM
**Infrastructure Readiness**: 0% (new feature)

### Research & Design

#### BPMN 2.0 Mapping to ProcessX

| BPMN Element | ProcessX Equivalent |
|--------------|---------------------|
| Start Event  | ProcessStep (type: START) |
| Task / User Task | ProcessStep (type: TASK) |
| Exclusive Gateway | ProcessStep (type: DECISION) |
| End Event | ProcessStep (type: END) |
| Sequence Flow | ProcessConnection |
| Lane | metadata.department |
| Documentation | description field |

### Backend Changes

#### 1. BPMN Service (`/backend/src/services/bpmn.service.ts`)

**Dependencies**:
- `fast-xml-parser` or `xml2js` for XML parsing/building
- `uuid` for ID generation

**Methods**:
- `importBPMN(xmlString: string, organizationId: string, userId: string)`
  - Parse BPMN XML
  - Extract process definition
  - Map tasks → ProcessSteps
  - Map sequence flows → ProcessConnections
  - Extract metadata (lanes, documentation)
  - Create Process record with steps and connections
  - Return created process

- `exportBPMN(processId: string)`
  - Fetch process with steps and connections
  - Build BPMN XML structure
  - Map ProcessSteps → BPMN elements
  - Map ProcessConnections → Sequence flows
  - Add metadata (lanes, documentation)
  - Return XML string

#### 2. BPMN Controller (`/backend/src/controllers/bpmn.controller.ts`)
- `POST /api/processes/import-bpmn` - Upload BPMN file
  - Multipart form data
  - Validate XML structure
  - Call import service
  - Return created process

- `GET /api/processes/:id/export-bpmn` - Download BPMN XML
  - Fetch process
  - Call export service
  - Return XML file with proper headers

#### 3. BPMN Routes (`/backend/src/routes/bpmn.routes.ts`)
- Register import/export endpoints
- Apply authentication
- Use multer for file upload

#### 4. Install Dependencies
```bash
npm install fast-xml-parser
npm install --save-dev @types/fast-xml-parser
```

### Frontend Changes

#### 1. BPMN Import Component (`/frontend/src/components/BPMNImport.tsx`)
- File upload dropzone
- Accept .bpmn, .xml files
- Preview uploaded file name
- "Import" button
- Success/error handling
- Redirect to imported process on success

#### 2. Update Processes Page
- Add "Import BPMN" button
- Opens BPMNImport modal

#### 3. Update Process Editor
- Add "Export to BPMN" button in toolbar
- Downloads .bpmn file
- Filename: `{process-name}-{date}.bpmn`

#### 4. API Client Updates
- Add `importBPMN()` - multipart form upload
- Add `exportBPMN()` - download blob

### BPMN XML Structure Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             targetNamespace="http://processx.com/bpmn">
  <process id="process_1" name="Auto Claims Processing">
    <startEvent id="start_1" name="Claim Received" />
    <task id="task_1" name="Validate Claim">
      <documentation>Verify claim completeness and eligibility</documentation>
    </task>
    <exclusiveGateway id="gateway_1" name="Valid?" />
    <task id="task_2" name="Investigation" />
    <endEvent id="end_1" name="Claim Settled" />

    <sequenceFlow id="flow_1" sourceRef="start_1" targetRef="task_1" />
    <sequenceFlow id="flow_2" sourceRef="task_1" targetRef="gateway_1" />
    <!-- ... more flows ... -->
  </process>
</definitions>
```

## Implementation Order

### Week 1
1. **Day 1-2**: Phase 1 - AI Process Generation (4-5h)
   - Backend: AI service extension, controller, routes
   - Frontend: Generation modal, API integration
   - Testing: Generate 3-4 sample processes

2. **Day 3**: Phase 2 Part 1 - Template Backend (2h)
   - Controller, routes, seed templates
   - Database seeding
   - API testing

3. **Day 4**: Phase 2 Part 2 - Template Frontend (2h)
   - Template gallery, detail modal
   - Integration with Processes page
   - Testing: Use templates to create processes

### Week 2
4. **Day 5**: Phase 3 - Export Formats (2-3h)
   - Markdown export (new)
   - Adapt existing exports for analysis
   - Frontend export UI
   - Testing: Export sample analysis

5. **Day 6-7**: Phase 4 - BPMN Support (5-6h)
   - BPMN service (import/export logic)
   - Controller, routes
   - Frontend import/export UI
   - Testing: Import BPMN from Bizagi, export and re-import

## Dependencies

### NPM Packages to Install

**Backend**:
- `fast-xml-parser` (BPMN parsing) - 40KB
- `multer` (file upload) - already installed?

**Frontend**:
- No new dependencies required (uses existing libraries)

## Testing Strategy

### Phase 1: AI Generation
- Test with various descriptions (short, long, vague, detailed)
- Verify process structure quality
- Test all AI providers (Anthropic, Google, OpenAI)
- Edge cases: very short descriptions, non-insurance domains

### Phase 2: Templates
- Create process from each template
- Verify all steps and connections imported correctly
- Test category filtering
- Test custom template creation (org-specific)

### Phase 3: Exports
- Export same analysis to all 5 formats
- Verify data completeness in each
- Check formatting and readability
- Test large analyses (20+ pain points, 30+ recommendations)

### Phase 4: BPMN
- Import BPMN files from standard tools (Bizagi, Camunda)
- Export ProcessX process → import to external tool
- Round-trip test: export → import → verify identical
- Test complex processes with gateways and multiple paths

## Success Criteria

### Phase 1
- [ ] Users can generate processes from 1-paragraph descriptions
- [ ] Generated processes have 5-15 steps with logical connections
- [ ] Insurance domain terminology used appropriately
- [ ] Preview before creating process

### Phase 2
- [ ] 8-10 insurance templates available
- [ ] Template gallery browsable by category
- [ ] Templates create fully-functional processes
- [ ] Usage count tracking works

### Phase 3
- [ ] All 5 export formats produce valid files
- [ ] Exports include all analysis components
- [ ] Professional formatting in Word/PowerPoint/PDF
- [ ] Markdown is readable and well-structured

### Phase 4
- [ ] Can import standard BPMN 2.0 XML files
- [ ] Export produces valid BPMN 2.0 XML
- [ ] Round-trip maintains process integrity
- [ ] Compatible with at least 2 external BPMN tools

## Future Enhancements (Not in Scope)

- Real-time collaboration on process editing
- Version control for templates
- Template marketplace (community sharing)
- BPMN diagram visual rendering (not just data import)
- Export to other standards (DMN, CMMN)
- AI-suggested improvements to existing processes
- Batch process generation from multiple descriptions
- Template recommendations based on process similarity

## Risks & Mitigations

**Risk**: AI generation produces low-quality processes
**Mitigation**: Refine prompts with insurance domain expertise, add validation rules, require preview before creation

**Risk**: BPMN import fails for complex diagrams
**Mitigation**: Start with subset of BPMN 2.0 spec, document supported elements, provide clear error messages

**Risk**: Export formats don't render properly on all platforms
**Mitigation**: Test on Windows/Mac/Linux, use well-supported libraries (xlsx, pptxgenjs, docx), provide fallback formats

**Risk**: Template library becomes outdated
**Mitigation**: Version templates, allow community contributions, periodic review process

## Total Effort Summary

- Phase 1: 4-5 hours
- Phase 2: 3-4 hours
- Phase 3: 2-3 hours
- Phase 4: 5-6 hours

**Total: 14-18 hours**

All phases leverage existing ProcessX infrastructure (AI pipeline, export system, database schema), minimizing new dependencies and complexity.
