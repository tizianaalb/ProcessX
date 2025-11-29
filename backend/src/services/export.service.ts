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
}
