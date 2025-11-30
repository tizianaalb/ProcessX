import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

interface ProcessData {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  steps: Array<{
    name: string;
    description?: string;
    type: string;
    duration?: number;
    responsibleRole?: string;
  }>;
  painPoints: Array<{
    title: string;
    description: string;
    category: string;
    severity: string;
    estimatedCost?: number;
    impact?: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    category: string;
    priority: string;
    expectedBenefits: string[];
    implementationSteps: string[];
    estimatedEffort?: string;
    estimatedTimeline?: string;
  }>;
}

export class ExportService {
  /**
   * Fetch process data for export
   */
  private static async getProcessData(processId: string, organizationId: string): Promise<ProcessData> {
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId,
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        painPoints: true,
        recommendations: true,
      },
    });

    if (!process) {
      throw new Error('Process not found');
    }

    return {
      id: process.id,
      name: process.name,
      description: process.description || undefined,
      type: process.type,
      category: process.category || undefined,
      steps: process.steps.map((step) => ({
        name: step.name,
        description: step.description || undefined,
        type: step.type,
        duration: step.duration || undefined,
        responsibleRole: step.responsibleRole || undefined,
      })),
      painPoints: process.painPoints.map((pp) => ({
        title: pp.title,
        description: pp.description,
        category: pp.category,
        severity: pp.severity,
        estimatedCost: pp.estimatedCost || undefined,
        impact: pp.impact || undefined,
      })),
      recommendations: process.recommendations.map((rec) => ({
        title: rec.title,
        description: rec.description || '',
        category: rec.recommendationType,
        priority: rec.priorityScore ? (rec.priorityScore > 7 ? 'HIGH' : rec.priorityScore > 4 ? 'MEDIUM' : 'LOW') : 'MEDIUM',
        expectedBenefits: [],
        implementationSteps: rec.implementationSteps,
        estimatedEffort: rec.estimatedEffort || undefined,
        estimatedTimeline: undefined,
      })),
    };
  }

  /**
   * Generate PowerPoint presentation
   */
  static async generatePowerPoint(processId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getProcessData(processId, organizationId);
    const pptx = new PptxGenJS();

    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { fill: '2563EB' };
    titleSlide.addText('Process Analysis Report', {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    titleSlide.addText(data.name, {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      color: 'E0E7FF',
      align: 'center',
    });
    titleSlide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.5,
      fontSize: 16,
      color: 'BFDBFE',
      align: 'center',
    });

    // Process Overview Slide
    const overviewSlide = pptx.addSlide();
    overviewSlide.addText('Process Overview', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: '1F2937',
    });

    const overviewRows = [
      ['Process Name', data.name],
      ['Type', data.type],
      ['Category', data.category || 'N/A'],
      ['Total Steps', data.steps.length.toString()],
      ['Pain Points', data.painPoints.length.toString()],
      ['Recommendations', data.recommendations.length.toString()],
    ];

    overviewSlide.addTable(overviewRows, {
      x: 0.5,
      y: 1.5,
      w: 9,
      fontSize: 14,
      color: '374151',
      fill: { color: 'F3F4F6' },
      border: { pt: 1, color: 'D1D5DB' },
    });

    // Process Steps Slide
    if (data.steps.length > 0) {
      const stepsSlide = pptx.addSlide();
      stepsSlide.addText('Process Steps', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '1F2937',
      });

      const stepsRows = [
        [
          { text: 'Step', options: { bold: true, fill: { color: '3B82F6' }, color: 'FFFFFF' } },
          { text: 'Type', options: { bold: true, fill: { color: '3B82F6' }, color: 'FFFFFF' } },
          { text: 'Duration', options: { bold: true, fill: { color: '3B82F6' }, color: 'FFFFFF' } },
        ],
        ...data.steps.map((step) => [
          step.name,
          step.type,
          step.duration ? `${step.duration} min` : 'N/A',
        ]),
      ];

      stepsSlide.addTable(stepsRows, {
        x: 0.5,
        y: 1.5,
        w: 9,
        fontSize: 12,
        color: '374151',
        border: { pt: 1, color: 'D1D5DB' },
      });
    }

    // Pain Points Slide
    if (data.painPoints.length > 0) {
      const painPointsSlide = pptx.addSlide();
      painPointsSlide.addText('Identified Pain Points', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '1F2937',
      });

      const ppRows = [
        [
          { text: 'Title', options: { bold: true, fill: { color: 'EF4444' }, color: 'FFFFFF' } },
          { text: 'Severity', options: { bold: true, fill: { color: 'EF4444' }, color: 'FFFFFF' } },
          { text: 'Category', options: { bold: true, fill: { color: 'EF4444' }, color: 'FFFFFF' } },
        ],
        ...data.painPoints.slice(0, 10).map((pp) => [pp.title, pp.severity, pp.category]),
      ];

      painPointsSlide.addTable(ppRows, {
        x: 0.5,
        y: 1.5,
        w: 9,
        fontSize: 11,
        color: '374151',
        border: { pt: 1, color: 'D1D5DB' },
      });
    }

    // Recommendations Slides
    if (data.recommendations.length > 0) {
      const recSlide = pptx.addSlide();
      recSlide.addText('Optimization Recommendations', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '1F2937',
      });

      data.recommendations.slice(0, 5).forEach((rec, idx) => {
        recSlide.addText(`${idx + 1}. ${rec.title}`, {
          x: 0.5,
          y: 1.5 + idx * 0.8,
          w: 9,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: '059669',
        });
        recSlide.addText(rec.description.substring(0, 150) + '...', {
          x: 0.8,
          y: 1.9 + idx * 0.8,
          w: 8.7,
          h: 0.4,
          fontSize: 12,
          color: '6B7280',
        });
      });
    }

    return await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  }

  /**
   * Generate PDF report
   */
  static async generatePDF(processId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getProcessData(processId, organizationId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title Page
      doc.fontSize(32).fillColor('#2563EB').text('Process Analysis Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(24).fillColor('#4B5563').text(data.name, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#9CA3AF').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(3);

      // Process Overview
      doc.fontSize(20).fillColor('#1F2937').text('Process Overview');
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#374151');
      doc.text(`Process Name: ${data.name}`);
      doc.text(`Type: ${data.type}`);
      doc.text(`Category: ${data.category || 'N/A'}`);
      doc.text(`Total Steps: ${data.steps.length}`);
      doc.text(`Pain Points Identified: ${data.painPoints.length}`);
      doc.text(`Recommendations: ${data.recommendations.length}`);
      doc.moveDown(2);

      // Process Steps
      if (data.steps.length > 0) {
        doc.addPage();
        doc.fontSize(20).fillColor('#1F2937').text('Process Steps');
        doc.moveDown(0.5);

        data.steps.forEach((step, idx) => {
          doc.fontSize(14).fillColor('#3B82F6').text(`${idx + 1}. ${step.name}`);
          doc.fontSize(10).fillColor('#6B7280');
          doc.text(`   Type: ${step.type}`);
          if (step.duration) doc.text(`   Duration: ${step.duration} minutes`);
          if (step.responsibleRole) doc.text(`   Responsible: ${step.responsibleRole}`);
          if (step.description) doc.text(`   ${step.description}`);
          doc.moveDown(0.5);
        });
      }

      // Pain Points
      if (data.painPoints.length > 0) {
        doc.addPage();
        doc.fontSize(20).fillColor('#1F2937').text('Identified Pain Points');
        doc.moveDown(0.5);

        data.painPoints.forEach((pp, idx) => {
          doc.fontSize(14).fillColor('#EF4444').text(`${idx + 1}. ${pp.title}`);
          doc.fontSize(10).fillColor('#6B7280');
          doc.text(`   Severity: ${pp.severity} | Category: ${pp.category}`);
          doc.text(`   ${pp.description}`);
          if (pp.estimatedCost) doc.text(`   Estimated Annual Cost: $${pp.estimatedCost.toLocaleString()}`);
          doc.moveDown(0.5);
        });
      }

      // Recommendations
      if (data.recommendations.length > 0) {
        doc.addPage();
        doc.fontSize(20).fillColor('#1F2937').text('Optimization Recommendations');
        doc.moveDown(0.5);

        data.recommendations.forEach((rec, idx) => {
          doc.fontSize(14).fillColor('#059669').text(`${idx + 1}. ${rec.title}`);
          doc.fontSize(10).fillColor('#6B7280');
          doc.text(`   Priority: ${rec.priority} | Category: ${rec.category}`);
          doc.text(`   ${rec.description}`);
          if (rec.implementationSteps.length > 0) {
            doc.text('   Implementation Steps:');
            rec.implementationSteps.forEach((step) => {
              doc.text(`     • ${step}`);
            });
          }
          doc.moveDown(0.5);
        });
      }

      doc.end();
    });
  }

  /**
   * Generate Excel spreadsheet
   */
  static async generateExcel(processId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getProcessData(processId, organizationId);
    const workbook = new ExcelJS.Workbook();

    // Overview Sheet
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.addRow(['Process Analysis Report']);
    overviewSheet.addRow(['']);
    overviewSheet.addRow(['Process Name', data.name]);
    overviewSheet.addRow(['Type', data.type]);
    overviewSheet.addRow(['Category', data.category || 'N/A']);
    overviewSheet.addRow(['Total Steps', data.steps.length]);
    overviewSheet.addRow(['Pain Points', data.painPoints.length]);
    overviewSheet.addRow(['Recommendations', data.recommendations.length]);
    overviewSheet.addRow(['Generated', new Date().toLocaleDateString()]);

    overviewSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
    overviewSheet.columns = [{ width: 25 }, { width: 50 }];

    // Process Steps Sheet
    const stepsSheet = workbook.addWorksheet('Process Steps');
    stepsSheet.addRow(['Step Name', 'Type', 'Duration (min)', 'Responsible Role', 'Description']);
    stepsSheet.getRow(1).font = { bold: true };
    stepsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    stepsSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    data.steps.forEach((step) => {
      stepsSheet.addRow([
        step.name,
        step.type,
        step.duration || 'N/A',
        step.responsibleRole || 'N/A',
        step.description || '',
      ]);
    });

    stepsSheet.columns = [
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
      { width: 50 },
    ];

    // Pain Points Sheet
    const ppSheet = workbook.addWorksheet('Pain Points');
    ppSheet.addRow(['Title', 'Severity', 'Category', 'Description', 'Estimated Cost', 'Impact']);
    ppSheet.getRow(1).font = { bold: true };
    ppSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' },
    };
    ppSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    data.painPoints.forEach((pp) => {
      ppSheet.addRow([
        pp.title,
        pp.severity,
        pp.category,
        pp.description,
        pp.estimatedCost ? `$${pp.estimatedCost.toLocaleString()}` : 'N/A',
        pp.impact || 'N/A',
      ]);
    });

    ppSheet.columns = [
      { width: 30 },
      { width: 12 },
      { width: 20 },
      { width: 50 },
      { width: 15 },
      { width: 40 },
    ];

    // Recommendations Sheet
    const recSheet = workbook.addWorksheet('Recommendations');
    recSheet.addRow(['Title', 'Priority', 'Category', 'Description', 'Effort', 'Implementation Steps']);
    recSheet.getRow(1).font = { bold: true };
    recSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    };
    recSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    data.recommendations.forEach((rec) => {
      recSheet.addRow([
        rec.title,
        rec.priority,
        rec.category,
        rec.description,
        rec.estimatedEffort || 'N/A',
        rec.implementationSteps.join('\n• '),
      ]);
    });

    recSheet.columns = [
      { width: 30 },
      { width: 12 },
      { width: 20 },
      { width: 50 },
      { width: 15 },
      { width: 50 },
    ];

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Generate Word document
   */
  static async generateWord(processId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getProcessData(processId, organizationId);

    const doc = new Document({
      sections: [
        {
          children: [
            // Title
            new Paragraph({
              text: 'Process Analysis Report',
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: data.name,
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Generated: ${new Date().toLocaleDateString()}`,
              spacing: { after: 600 },
            }),

            // Process Overview
            new Paragraph({
              text: 'Process Overview',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Process Name: ', bold: true }),
                new TextRun(data.name),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Type: ', bold: true }),
                new TextRun(data.type),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Category: ', bold: true }),
                new TextRun(data.category || 'N/A'),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Total Steps: ', bold: true }),
                new TextRun(data.steps.length.toString()),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Pain Points: ', bold: true }),
                new TextRun(data.painPoints.length.toString()),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Recommendations: ', bold: true }),
                new TextRun(data.recommendations.length.toString()),
              ],
              spacing: { after: 600 },
            }),

            // Process Steps
            new Paragraph({
              text: 'Process Steps',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            ...data.steps.flatMap((step, idx) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${idx + 1}. ${step.name}`, bold: true }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `   Type: ${step.type}` }),
                ],
              }),
              ...(step.duration ? [new Paragraph({ text: `   Duration: ${step.duration} minutes` })] : []),
              ...(step.description ? [new Paragraph({ text: `   ${step.description}` })] : []),
              new Paragraph({ text: '' }),
            ]),

            // Pain Points
            new Paragraph({
              text: 'Identified Pain Points',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            ...data.painPoints.flatMap((pp, idx) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${idx + 1}. ${pp.title}`, bold: true }),
                ],
              }),
              new Paragraph({
                text: `   Severity: ${pp.severity} | Category: ${pp.category}`,
              }),
              new Paragraph({
                text: `   ${pp.description}`,
              }),
              new Paragraph({ text: '' }),
            ]),

            // Recommendations
            new Paragraph({
              text: 'Optimization Recommendations',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            ...data.recommendations.flatMap((rec, idx) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${idx + 1}. ${rec.title}`, bold: true }),
                ],
              }),
              new Paragraph({
                text: `   Priority: ${rec.priority} | Category: ${rec.category}`,
              }),
              new Paragraph({
                text: `   ${rec.description}`,
              }),
              ...(rec.implementationSteps.length > 0
                ? [
                    new Paragraph({ text: '   Implementation Steps:' }),
                    ...rec.implementationSteps.map(
                      (step) => new Paragraph({ text: `     • ${step}` })
                    ),
                  ]
                : []),
              new Paragraph({ text: '' }),
            ]),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Fetch analysis data for export
   */
  private static async getAnalysisData(analysisId: string, organizationId: string) {
    const analysis = await prisma.aIAnalysis.findFirst({
      where: {
        id: analysisId,
      },
      include: {
        process: {
          where: {
            organizationId,
          },
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!analysis || !analysis.process) {
      throw new Error('Analysis not found or access denied');
    }

    if (analysis.status !== 'COMPLETED') {
      throw new Error('Analysis is not completed yet');
    }

    return {
      id: analysis.id,
      processName: analysis.process.name,
      processDescription: analysis.process.description || undefined,
      processType: analysis.process.type,
      analysisType: analysis.analysisType,
      understanding: analysis.understanding as any,
      painPoints: (analysis.detectedPainPoints as any) || [],
      recommendations: (analysis.recommendations as any) || [],
      toBeProcess: (analysis.generatedProcess as any) || null,
      aiProvider: analysis.aiProvider,
      createdAt: analysis.createdAt,
      completedAt: analysis.updatedAt,
    };
  }

  /**
   * Generate Markdown export for analysis
   */
  static async generateAnalysisMarkdown(analysisId: string, organizationId: string): Promise<string> {
    const data = await this.getAnalysisData(analysisId, organizationId);

    let markdown = `# Process Analysis Report\n\n`;
    markdown += `**Process:** ${data.processName}\n`;
    markdown += `**Analysis Date:** ${data.createdAt.toLocaleDateString()}\n`;
    markdown += `**AI Provider:** ${data.aiProvider}\n\n`;

    // Process Understanding
    if (data.understanding) {
      markdown += `## Process Understanding\n\n`;
      if (data.understanding.overview) {
        markdown += `### Overview\n${data.understanding.overview}\n\n`;
      }
      if (data.understanding.purpose) {
        markdown += `### Purpose\n${data.understanding.purpose}\n\n`;
      }
      if (data.understanding.keyStakeholders && data.understanding.keyStakeholders.length > 0) {
        markdown += `### Key Stakeholders\n`;
        data.understanding.keyStakeholders.forEach((stakeholder: any) => {
          markdown += `- **${stakeholder.role}**: ${stakeholder.responsibilities}\n`;
        });
        markdown += `\n`;
      }
      if (data.understanding.inputs && data.understanding.inputs.length > 0) {
        markdown += `### Process Inputs\n`;
        data.understanding.inputs.forEach((input: string) => {
          markdown += `- ${input}\n`;
        });
        markdown += `\n`;
      }
      if (data.understanding.outputs && data.understanding.outputs.length > 0) {
        markdown += `### Process Outputs\n`;
        data.understanding.outputs.forEach((output: string) => {
          markdown += `- ${output}\n`;
        });
        markdown += `\n`;
      }
    }

    // Pain Points
    if (data.painPoints && data.painPoints.length > 0) {
      markdown += `## Identified Pain Points\n\n`;
      data.painPoints.forEach((pp: any, idx: number) => {
        markdown += `### ${idx + 1}. ${pp.title}\n`;
        markdown += `**Category:** ${pp.category} | **Severity:** ${pp.severity}\n\n`;
        markdown += `${pp.description}\n\n`;
        if (pp.affectedSteps && pp.affectedSteps.length > 0) {
          markdown += `**Affected Steps:** ${pp.affectedSteps.join(', ')}\n\n`;
        }
        if (pp.impact) {
          markdown += `**Impact:** ${pp.impact}\n\n`;
        }
        if (pp.estimatedCost) {
          markdown += `**Estimated Cost:** $${pp.estimatedCost.toLocaleString()}/year\n\n`;
        }
      });
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      data.recommendations.forEach((rec: any, idx: number) => {
        markdown += `### ${idx + 1}. ${rec.title}\n`;
        markdown += `**Category:** ${rec.category} | **Priority:** ${rec.priority}\n\n`;
        markdown += `${rec.description}\n\n`;
        if (rec.expectedBenefits && rec.expectedBenefits.length > 0) {
          markdown += `**Expected Benefits:**\n`;
          rec.expectedBenefits.forEach((benefit: string) => {
            markdown += `- ${benefit}\n`;
          });
          markdown += `\n`;
        }
        if (rec.implementationSteps && rec.implementationSteps.length > 0) {
          markdown += `**Implementation Steps:**\n`;
          rec.implementationSteps.forEach((step: string, stepIdx: number) => {
            markdown += `${stepIdx + 1}. ${step}\n`;
          });
          markdown += `\n`;
        }
        if (rec.estimatedEffort) {
          markdown += `**Estimated Effort:** ${rec.estimatedEffort}\n\n`;
        }
      });
    }

    // TO-BE Process
    if (data.toBeProcess) {
      markdown += `## Target (TO-BE) Process\n\n`;
      markdown += `**Name:** ${data.toBeProcess.name}\n`;
      markdown += `**Description:** ${data.toBeProcess.description || 'N/A'}\n\n`;
      if (data.toBeProcess.steps && data.toBeProcess.steps.length > 0) {
        markdown += `### Process Steps\n\n`;
        data.toBeProcess.steps.forEach((step: any, idx: number) => {
          markdown += `${idx + 1}. **${step.name}** (${step.type})\n`;
          if (step.description) {
            markdown += `   ${step.description}\n`;
          }
          if (step.duration) {
            markdown += `   Duration: ${step.duration} minutes\n`;
          }
          markdown += `\n`;
        });
      }
      if (data.toBeProcess.expectedImprovements && data.toBeProcess.expectedImprovements.length > 0) {
        markdown += `### Expected Improvements\n`;
        data.toBeProcess.expectedImprovements.forEach((improvement: string) => {
          markdown += `- ${improvement}\n`;
        });
        markdown += `\n`;
      }
    }

    markdown += `---\n`;
    markdown += `*Report generated on ${new Date().toLocaleString()}*\n`;

    return markdown;
  }

  /**
   * Generate PowerPoint export for analysis
   */
  static async generateAnalysisPowerPoint(analysisId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getAnalysisData(analysisId, organizationId);
    const pptx = new PptxGenJS();

    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { fill: '7C3AED' }; // Purple
    titleSlide.addText('AI Process Analysis Report', {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    titleSlide.addText(data.processName, {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      color: 'E9D5FF',
      align: 'center',
    });
    titleSlide.addText(`Analysis Date: ${data.createdAt.toLocaleDateString()}`, {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.5,
      fontSize: 16,
      color: 'DDD6FE',
      align: 'center',
    });

    // Understanding Slide
    if (data.understanding) {
      const understandingSlide = pptx.addSlide();
      understandingSlide.addText('Process Understanding', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '1F2937',
      });

      let yPos = 1.3;
      if (data.understanding.overview) {
        understandingSlide.addText('Overview', {
          x: 0.5,
          y: yPos,
          w: 9,
          h: 0.4,
          fontSize: 18,
          bold: true,
          color: '374151',
        });
        yPos += 0.5;
        understandingSlide.addText(data.understanding.overview, {
          x: 0.5,
          y: yPos,
          w: 9,
          h: 1.5,
          fontSize: 14,
          color: '4B5563',
        });
      }
    }

    // Pain Points Slides
    if (data.painPoints && data.painPoints.length > 0) {
      const painPointsSlide = pptx.addSlide();
      painPointsSlide.addText('Identified Pain Points', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '1F2937',
      });

      const ppRows = [
        ['Title', 'Category', 'Severity', 'Impact'],
        ...data.painPoints.slice(0, 8).map((pp: any) => [
          pp.title,
          pp.category,
          pp.severity,
          pp.impact || 'N/A',
        ]),
      ];

      painPointsSlide.addTable(ppRows, {
        x: 0.5,
        y: 1.5,
        w: 9,
        fontSize: 12,
        color: '374151',
        fill: { color: 'FEF2F2' },
        border: { pt: 1, color: 'FCA5A5' },
      });
    }

    // Recommendations Slides
    if (data.recommendations && data.recommendations.length > 0) {
      const recSlide = pptx.addSlide();
      recSlide.addText('Recommendations', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '1F2937',
      });

      const recRows = [
        ['Title', 'Category', 'Priority', 'Effort'],
        ...data.recommendations.slice(0, 8).map((rec: any) => [
          rec.title,
          rec.category,
          rec.priority,
          rec.estimatedEffort || 'N/A',
        ]),
      ];

      recSlide.addTable(recRows, {
        x: 0.5,
        y: 1.5,
        w: 9,
        fontSize: 12,
        color: '374151',
        fill: { color: 'F0FDF4' },
        border: { pt: 1, color: '86EFAC' },
      });
    }

    // TO-BE Process Slide
    if (data.toBeProcess && data.toBeProcess.steps) {
      const toBeSlide = pptx.addSlide();
      toBeSlide.addText('Target (TO-BE) Process', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '1F2937',
      });

      const stepRows = [
        ['#', 'Step Name', 'Type', 'Duration'],
        ...data.toBeProcess.steps.slice(0, 10).map((step: any, idx: number) => [
          (idx + 1).toString(),
          step.name,
          step.type,
          step.duration ? `${step.duration} min` : 'N/A',
        ]),
      ];

      toBeSlide.addTable(stepRows, {
        x: 0.5,
        y: 1.5,
        w: 9,
        fontSize: 12,
        color: '374151',
        fill: { color: 'EFF6FF' },
        border: { pt: 1, color: '93C5FD' },
      });
    }

    return await pptx.writeFile({ outputType: 'nodebuffer' }) as Buffer;
  }

  /**
   * Generate PDF export for analysis
   */
  static async generateAnalysisPDF(analysisId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getAnalysisData(analysisId, organizationId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title Page
      doc.fontSize(28).fillColor('#7C3AED').text('AI Process Analysis Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(20).fillColor('#6366F1').text(data.processName, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#9CA3AF').text(`Analysis Date: ${data.createdAt.toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Process Understanding
      if (data.understanding) {
        doc.fontSize(18).fillColor('#1F2937').text('Process Understanding');
        doc.moveDown(0.5);

        if (data.understanding.overview) {
          doc.fontSize(14).fillColor('#374151').text('Overview', { underline: true });
          doc.moveDown(0.3);
          doc.fontSize(11).fillColor('#4B5563').text(data.understanding.overview);
          doc.moveDown(1);
        }

        if (data.understanding.keySteps && data.understanding.keySteps.length > 0) {
          doc.fontSize(14).fillColor('#374151').text('Key Steps', { underline: true });
          doc.moveDown(0.3);
          data.understanding.keySteps.forEach((step: string) => {
            doc.fontSize(11).fillColor('#4B5563').text(`• ${step}`);
          });
          doc.moveDown(1);
        }
      }

      // Pain Points
      if (data.painPoints && data.painPoints.length > 0) {
        doc.addPage();
        doc.fontSize(18).fillColor('#1F2937').text('Identified Pain Points');
        doc.moveDown(1);

        data.painPoints.forEach((pp: any, index: number) => {
          doc.fontSize(13).fillColor('#DC2626').text(`${index + 1}. ${pp.title}`);
          doc.moveDown(0.2);
          doc.fontSize(10).fillColor('#6B7280').text(`Category: ${pp.category} | Severity: ${pp.severity}`);
          doc.moveDown(0.2);
          doc.fontSize(11).fillColor('#4B5563').text(pp.description);
          if (pp.impact) {
            doc.fontSize(10).fillColor('#059669').text(`Impact: ${pp.impact}`);
          }
          doc.moveDown(0.8);
        });
      }

      // Recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        doc.addPage();
        doc.fontSize(18).fillColor('#1F2937').text('Optimization Recommendations');
        doc.moveDown(1);

        data.recommendations.forEach((rec: any, index: number) => {
          doc.fontSize(13).fillColor('#2563EB').text(`${index + 1}. ${rec.title}`);
          doc.moveDown(0.2);
          doc.fontSize(10).fillColor('#6B7280').text(`Category: ${rec.category} | Priority: ${rec.priority}`);
          doc.moveDown(0.2);
          doc.fontSize(11).fillColor('#4B5563').text(rec.description);
          doc.moveDown(0.8);
        });
      }

      // Generated TO-BE Process
      if (data.toBeProcess) {
        doc.addPage();
        doc.fontSize(18).fillColor('#1F2937').text('Generated TO-BE Process');
        doc.moveDown(0.5);
        doc.fontSize(14).fillColor('#374151').text(data.toBeProcess.name);
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#4B5563').text(data.toBeProcess.description || '');
        doc.moveDown(1);

        doc.fontSize(14).fillColor('#374151').text('Process Steps', { underline: true });
        doc.moveDown(0.5);
        data.toBeProcess.steps.forEach((step: any, index: number) => {
          doc.fontSize(11).fillColor('#4B5563').text(`${index + 1}. ${step.name} (${step.type})`);
          if (step.description) {
            doc.fontSize(10).fillColor('#6B7280').text(`   ${step.description}`);
          }
        });
      }

      doc.end();
    });
  }

  /**
   * Generate Excel export for analysis
   */
  static async generateAnalysisExcel(analysisId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getAnalysisData(analysisId, organizationId);
    const workbook = new ExcelJS.Workbook();

    // Overview Sheet
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.columns = [
      { header: 'Property', key: 'property', width: 25 },
      { header: 'Value', key: 'value', width: 60 },
    ];

    overviewSheet.addRow({ property: 'Process Name', value: data.processName });
    overviewSheet.addRow({ property: 'Analysis Date', value: data.createdAt.toLocaleDateString() });
    overviewSheet.addRow({ property: 'Organization', value: organizationId });

    if (data.understanding?.overview) {
      overviewSheet.addRow({ property: 'Overview', value: data.understanding.overview });
    }

    // Style header
    overviewSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    overviewSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7C3AED' },
    };

    // Pain Points Sheet
    if (data.painPoints && data.painPoints.length > 0) {
      const ppSheet = workbook.addWorksheet('Pain Points');
      ppSheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Severity', key: 'severity', width: 15 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Impact', key: 'impact', width: 40 },
      ];

      data.painPoints.forEach((pp: any) => {
        ppSheet.addRow({
          title: pp.title,
          category: pp.category,
          severity: pp.severity,
          description: pp.description,
          impact: pp.impact || 'N/A',
        });
      });

      // Style header
      ppSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ppSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC2626' },
      };
    }

    // Recommendations Sheet
    if (data.recommendations && data.recommendations.length > 0) {
      const recSheet = workbook.addWorksheet('Recommendations');
      recSheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Expected Benefits', key: 'benefits', width: 40 },
      ];

      data.recommendations.forEach((rec: any) => {
        recSheet.addRow({
          title: rec.title,
          category: rec.category,
          priority: rec.priority,
          description: rec.description,
          benefits: rec.expectedBenefits?.join('; ') || 'N/A',
        });
      });

      // Style header
      recSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      recSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
    }

    // TO-BE Process Sheet
    if (data.toBeProcess && data.toBeProcess.steps) {
      const toBeSheet = workbook.addWorksheet('TO-BE Process');
      toBeSheet.columns = [
        { header: '#', key: 'index', width: 5 },
        { header: 'Step Name', key: 'name', width: 30 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Duration (min)', key: 'duration', width: 15 },
      ];

      data.toBeProcess.steps.forEach((step: any, index: number) => {
        toBeSheet.addRow({
          index: index + 1,
          name: step.name,
          type: step.type,
          description: step.description || '',
          duration: step.duration || 'N/A',
        });
      });

      // Style header
      toBeSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      toBeSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' },
      };
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Generate Word document export for analysis
   */
  static async generateAnalysisWord(analysisId: string, organizationId: string): Promise<Buffer> {
    const data = await this.getAnalysisData(analysisId, organizationId);
    const sections: any[] = [];

    // Title
    sections.push(
      new Paragraph({
        text: 'AI Process Analysis Report',
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      })
    );

    sections.push(
      new Paragraph({
        text: data.processName,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 },
      })
    );

    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Analysis Date: ${data.createdAt.toLocaleDateString()}`,
            italics: true,
            color: '6B7280',
          }),
        ],
        spacing: { after: 400 },
      })
    );

    // Process Understanding
    if (data.understanding) {
      sections.push(
        new Paragraph({
          text: 'Process Understanding',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );

      if (data.understanding.overview) {
        sections.push(
          new Paragraph({
            text: 'Overview',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(
          new Paragraph({
            text: data.understanding.overview,
            spacing: { after: 200 },
          })
        );
      }

      if (data.understanding.keySteps && data.understanding.keySteps.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Key Steps',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        data.understanding.keySteps.forEach((step: string) => {
          sections.push(
            new Paragraph({
              text: step,
              bullet: { level: 0 },
            })
          );
        });
      }
    }

    // Pain Points
    if (data.painPoints && data.painPoints.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Identified Pain Points',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      data.painPoints.forEach((pp: any, index: number) => {
        sections.push(
          new Paragraph({
            text: `${index + 1}. ${pp.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Category: ${pp.category} | Severity: ${pp.severity}`,
                bold: true,
                color: 'DC2626',
              }),
            ],
            spacing: { after: 100 },
          })
        );
        sections.push(
          new Paragraph({
            text: pp.description,
            spacing: { after: 100 },
          })
        );
        if (pp.impact) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Impact: ${pp.impact}`,
                  italics: true,
                  color: '059669',
                }),
              ],
              spacing: { after: 200 },
            })
          );
        }
      });
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Optimization Recommendations',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      data.recommendations.forEach((rec: any, index: number) => {
        sections.push(
          new Paragraph({
            text: `${index + 1}. ${rec.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Category: ${rec.category} | Priority: ${rec.priority}`,
                bold: true,
                color: '2563EB',
              }),
            ],
            spacing: { after: 100 },
          })
        );
        sections.push(
          new Paragraph({
            text: rec.description,
            spacing: { after: 200 },
          })
        );
      });
    }

    // Generated TO-BE Process
    if (data.toBeProcess) {
      sections.push(
        new Paragraph({
          text: 'Generated TO-BE Process',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      sections.push(
        new Paragraph({
          text: data.toBeProcess.name,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 },
        })
      );
      if (data.toBeProcess.description) {
        sections.push(
          new Paragraph({
            text: data.toBeProcess.description,
            spacing: { after: 200 },
          })
        );
      }

      sections.push(
        new Paragraph({
          text: 'Process Steps',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );

      data.toBeProcess.steps.forEach((step: any, index: number) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${step.name}`,
                bold: true,
              }),
              new TextRun({
                text: ` (${step.type})`,
                italics: true,
                color: '6B7280',
              }),
            ],
          })
        );
        if (step.description) {
          sections.push(
            new Paragraph({
              text: `   ${step.description}`,
              spacing: { after: 100 },
            })
          );
        }
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}
