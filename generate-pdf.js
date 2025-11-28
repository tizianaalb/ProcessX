const fs = require('fs');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function generatePDF() {
  try {
    // Read the markdown file
    const markdown = fs.readFileSync('./PROJECT_PROPOSAL.md', 'utf8');

    // Convert markdown to HTML
    const html = marked.parse(markdown);

    // Create a full HTML document with styling
    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-top: 40px;
    }
    h2 {
      color: #1e40af;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
      margin-top: 30px;
    }
    h3 {
      color: #1e3a8a;
      margin-top: 24px;
    }
    code {
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background-color: #f3f4f6;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      border-left: 4px solid #2563eb;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 16px;
      margin-left: 0;
      color: #6b7280;
      font-style: italic;
    }
    ul, ol {
      padding-left: 24px;
    }
    li {
      margin: 8px 0;
    }
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 40px 0;
    }
    .page-break {
      page-break-after: always;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `;

    // Launch puppeteer and generate PDF
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

    console.log('Generating PDF...');
    await page.pdf({
      path: './PROJECT_PROPOSAL.pdf',
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"></div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });

    await browser.close();

    console.log('✅ PDF generated successfully: PROJECT_PROPOSAL.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
}

generatePDF();
