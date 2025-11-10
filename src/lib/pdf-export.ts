// Dynamic imports for client-side only
const getJsPDF = async () => {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
};

const getHtml2Canvas = async () => {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas;
};

export interface PDFExportOptions {
  title: string;
  author: string;
  fontSize?: number;
  pageSize?: 'a4' | 'letter' | 'a5';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export class PDFExporter {
  private options: Required<PDFExportOptions>;

  constructor(options: PDFExportOptions) {
    this.options = {
      fontSize: 12,
      pageSize: 'a4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      ...options
    };
  }

  async exportFromHTML(htmlContent: string): Promise<void> {
    try {
      // Dynamic imports
      const jsPDF = await getJsPDF();
      const html2canvas = await getHtml2Canvas();
      
      // Create a temporary container for rendering
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '8.5in'; // Standard page width
      tempContainer.style.fontFamily = 'Georgia, serif';
      tempContainer.style.fontSize = `${this.options.fontSize}px`;
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.color = '#000';
      tempContainer.style.backgroundColor = '#fff';
      
      // Add CSS for page breaks and styling
      const style = document.createElement('style');
      style.textContent = `
        .page-break-before {
          page-break-before: always;
          break-before: page;
          margin-top: 40px;
        }
        .prose h1 { font-size: 24px; margin: 20px 0; font-weight: bold; }
        .prose h2 { font-size: 20px; margin: 16px 0; font-weight: bold; }
        .prose h3 { font-size: 18px; margin: 14px 0; font-weight: bold; }
        .prose p { margin: 12px 0; text-align: justify; }
        .prose blockquote { 
          margin: 20px 0; 
          padding: 0 20px; 
          border-left: 4px solid #ccc; 
          font-style: italic; 
        }
        .prose ul, .prose ol { margin: 12px 0; padding-left: 30px; }
        .prose li { margin: 6px 0; }
        .text-center { text-align: center; }
        .text-justify { text-align: justify; }
        .font-bold { font-weight: bold; }
        .italic { font-style: italic; }
        .underline { text-decoration: underline; }
      `;
      document.head.appendChild(style);
      document.body.appendChild(tempContainer);

      // Get page dimensions
      const pageDimensions = this.getPageDimensions();
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: this.options.orientation,
        unit: 'pt',
        format: this.options.pageSize
      });

      // Set document properties
      pdf.setProperties({
        title: this.options.title,
        author: this.options.author,
        creator: 'Enhanced Book Editor'
      });

      // Split content by page breaks
      const pageElements = tempContainer.querySelectorAll('.page-break-before, body > div:first-child');
      let isFirstPage = true;

      for (const element of Array.from(pageElements)) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        
        // Create a temporary page container
        const pageContainer = document.createElement('div');
        pageContainer.style.width = `${pageDimensions.width - this.options.margins.left - this.options.margins.right}pt`;
        pageContainer.style.padding = '20pt';
        pageContainer.style.fontFamily = 'Georgia, serif';
        pageContainer.style.fontSize = `${this.options.fontSize}px`;
        pageContainer.style.lineHeight = '1.6';
        pageContainer.appendChild(element.cloneNode(true));
        
        document.body.appendChild(pageContainer);

        try {
          // Convert to canvas
          const canvas = await html2canvas(pageContainer, {
            useCORS: true,
            background: '#ffffff',
            width: pageDimensions.width - this.options.margins.left - this.options.margins.right,
            height: pageDimensions.height - this.options.margins.top - this.options.margins.bottom
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageDimensions.width - this.options.margins.left - this.options.margins.right;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(
            imgData, 
            'PNG', 
            this.options.margins.left, 
            this.options.margins.top, 
            imgWidth, 
            imgHeight
          );

        } catch (canvasError) {
          console.warn('Canvas rendering failed, falling back to text:', canvasError);
          // Fallback to text-based rendering
          this.addTextContent(pdf, element.textContent || '', isFirstPage);
        }

        document.body.removeChild(pageContainer);
        isFirstPage = false;
      }

      // Clean up
      document.body.removeChild(tempContainer);
      document.head.removeChild(style);

      // Download the PDF
      const filename = `${this.options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getPageDimensions() {
    const dimensions = {
      a4: { width: 595.28, height: 841.89 },
      letter: { width: 612, height: 792 },
      a5: { width: 420, height: 595.28 }
    };
    
    const size = dimensions[this.options.pageSize];
    if (this.options.orientation === 'landscape') {
      return { width: size.height, height: size.width };
    }
    return size;
  }

  private addTextContent(pdf: any, text: string, isFirstPage: boolean) {
    const lines = pdf.splitTextToSize(text, 
      this.getPageDimensions().width - this.options.margins.left - this.options.margins.right
    );
    
    let yPosition = this.options.margins.top;
    const lineHeight = this.options.fontSize * 1.2;
    
    for (const line of lines) {
      if (yPosition > this.getPageDimensions().height - this.options.margins.bottom) {
        pdf.addPage();
        yPosition = this.options.margins.top;
      }
      
      pdf.setFontSize(this.options.fontSize);
      pdf.text(line, this.options.margins.left, yPosition);
      yPosition += lineHeight;
    }
  }
}

// Utility function for easy export
export async function exportToPDF(htmlContent: string, options: PDFExportOptions): Promise<void> {
  const exporter = new PDFExporter(options);
  await exporter.exportFromHTML(htmlContent);
}

// Quick export function for book content
export async function exportBookToPDF(
  title: string, 
  author: string, 
  htmlContent: string,
  customOptions?: Partial<PDFExportOptions>
): Promise<void> {
  const options: PDFExportOptions = {
    title,
    author,
    fontSize: 12,
    pageSize: 'a4',
    orientation: 'portrait',
    ...customOptions
  };
  
  await exportToPDF(htmlContent, options);
}