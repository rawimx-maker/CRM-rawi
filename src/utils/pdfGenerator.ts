import { jsPDF } from 'jspdf';
import { Quote, CompanyInfo } from '../types';

const RAWI_LOGO_URL = '/assets/aistudio/RAWI_Logo_PNG_8b0c4f46.png';

let cachedLogoDataUrl: string | null = null;
let cachedLogoAspectRatio = 2.66; // width / height fallback matching RAWI wide logo

function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; aspectRatio: number } | null> {
  if (cachedLogoDataUrl) {
    return Promise.resolve({ dataUrl: cachedLogoDataUrl, aspectRatio: cachedLogoAspectRatio });
  }
  if (typeof window === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const ratio = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 2.66;
        cachedLogoDataUrl = dataUrl;
        cachedLogoAspectRatio = ratio;
        resolve({ dataUrl, aspectRatio: ratio });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Preload logo silently on browser load
if (typeof window !== 'undefined') {
  loadImageAsDataUrl(RAWI_LOGO_URL);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function calculateValidUntil15Days(createdAtIso?: string): string {
  const baseStr = createdAtIso && /^\d{4}-\d{2}-\d{2}$/.test(createdAtIso)
    ? createdAtIso
    : new Date().toISOString().split('T')[0];
  const [year, month, day] = baseStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 15));
  return date.toISOString().split('T')[0];
}

export function formatQuoteAuthorName(rawName?: string): string {
  if (!rawName) return 'Usuario RAWI';
  return rawName
    .replace(/\s*\((admin|administrador|project manager|pm|colaborador|colaboradora|colab|cliente)\)\s*$/i, '')
    .trim() || rawName.trim();
}

export async function generateQuotePDF(quote: Quote, company: CompanyInfo): Promise<void> {
  const logoInfo = await loadImageAsDataUrl(RAWI_LOGO_URL);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner - RAWI Deep Indigo (#271871 -> RGB 39, 24, 113)
  doc.setFillColor(39, 24, 113);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Electric Cyan Accent Line (#00F5D4 -> RGB 0, 245, 212)
  doc.setFillColor(0, 245, 212);
  doc.rect(0, 30, pageWidth, 2, 'F');

  // Left side: White rounded badge with RAWI Logo PNG (if loaded) + Tagline
  let textStartX = margin;
  if (logoInfo) {
    const logoHeight = 12;
    const logoWidth = Math.min(38, logoHeight * logoInfo.aspectRatio);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 5.5, logoWidth + 5, logoHeight + 4, 2, 2, 'F');
    doc.addImage(logoInfo.dataUrl, 'PNG', margin + 2.5, 7.5, logoWidth, logoHeight);
    textStartX = margin + logoWidth + 9;
  }

  // Company Name & Tagline in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(logoInfo ? 12 : 16);
  doc.text(company.name.toUpperCase(), textStartX, 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(186, 230, 253);
  doc.text(company.tagline, textStartX, 19.5, { maxWidth: 85 });

  // Quote Label & Number right aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text('COTIZACIÓN COMERCIAL', pageWidth - margin, 13.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 245, 212); // Electric Cyan
  doc.text(`N° ${quote.code}`, pageWidth - margin, 20.5, { align: 'right' });

  // Reset text color
  doc.setTextColor(30, 41, 59);

  let currentY = 39;

  // Metadata Grid: Emisor & Cliente
  const colWidth = (contentWidth - 8) / 2;

  // Box 1: Emisor (Nuestra Empresa)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(39, 24, 113); // RAWI Indigo
  doc.text('EMISOR:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(company.name, margin + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${company.taxId}`, margin + 4, currentY + 17);
  doc.text(`Tel: ${company.phone} | ${company.email}`, margin + 4, currentY + 21.5);
  doc.text(company.address, margin + 4, currentY + 26, { maxWidth: colWidth - 8 });

  // Box 2: Cliente
  const col2X = margin + colWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, currentY, colWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(39, 24, 113); // RAWI Indigo
  doc.text('CLIENTE / RECEPTOR:', col2X + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.clientCompany || quote.clientName, col2X + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Atención: ${quote.clientName}`, col2X + 4, currentY + 17);
  doc.text(`Email: ${quote.clientEmail} ${quote.clientPhone ? `| Tel: ${quote.clientPhone}` : ''}`, col2X + 4, currentY + 21.5, { maxWidth: colWidth - 8 });
  if (quote.clientAddress || quote.clientTaxId || quote.clientPostalCode) {
    const extra = [
      quote.clientTaxId ? `RFC: ${quote.clientTaxId}` : '',
      quote.clientPostalCode ? `C.P. ${quote.clientPostalCode}` : '',
      quote.clientAddress || '',
    ].filter(Boolean).join(' • ');
    doc.text(extra, col2X + 4, currentY + 26, { maxWidth: colWidth - 8 });
  }

  currentY += 40;

  // Dates & Status bar
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 10, 1.5, 1.5, 'F');

  const computedValidUntil = calculateValidUntil15Days(quote.createdAt);
  const authorDisplayName = formatQuoteAuthorName(quote.createdBy);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Emisión:', margin + 4, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.createdAt, margin + 19, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.text('Vigencia (15 días):', margin + 44, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(computedValidUntil, margin + 72, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.text('Elaborado por:', margin + 98, currentY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(authorDisplayName, margin + 121, currentY + 6.5, { maxWidth: contentWidth - 124 });

  currentY += 16;

  // Title of quotation proposal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(`Asunto: ${quote.title}`, contentWidth);
  doc.text(titleLines, margin, currentY);
  currentY += titleLines.length * 5 + 1.5;

  // Presentation message / Greeting letter
  const greetingText = company.greeting || 'Buen día, por este medio le hago entrega de la información solicitada sobre el precios de los servicios.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const greetingLines = doc.splitTextToSize(greetingText, contentWidth);
  doc.text(greetingLines, margin, currentY);
  currentY += greetingLines.length * 4.2 + 4;

  // Table Headers
  const colPositions = {
    item: margin,
    desc: margin + 10,
    qty: margin + 98,
    unit: margin + 114,
    disc: margin + 140,
    subtotal: pageWidth - margin,
  };

  const renderTableHeader = (yPos: number) => {
    doc.setFillColor(39, 24, 113); // RAWI Indigo
    doc.rect(margin, yPos, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('#', colPositions.item + 3, yPos + 5.5);
    doc.text('DESCRIPCIÓN DEL CONCEPTO / SERVICIO', colPositions.desc, yPos + 5.5);
    doc.text('CANT.', colPositions.qty, yPos + 5.5);
    doc.text('P. UNIT.', colPositions.unit, yPos + 5.5);
    doc.text('DESC.', colPositions.disc, yPos + 5.5);
    doc.text('TOTAL', colPositions.subtotal - 2, yPos + 5.5, { align: 'right' });
  };

  renderTableHeader(currentY);
  currentY += 8;

  // Table Rows with dynamic height for full wrapped description
  const descMaxWidth = 84;
  quote.items.forEach((item, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    const wrappedDesc = doc.splitTextToSize(item.description || '-', descMaxWidth);
    const rowHeight = Math.max(10, wrappedDesc.length * 4 + 4.5);

    // Handle page break if needed
    if (currentY + rowHeight > pageHeight - 40) {
      doc.addPage();
      currentY = 18;
      renderTableHeader(currentY);
      currentY += 8;
    }

    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

    // Bottom border
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(String(index + 1), colPositions.item + 3, currentY + 5.5);

    doc.setTextColor(15, 23, 42);
    doc.text(wrappedDesc, colPositions.desc, currentY + 5.5);

    doc.setTextColor(71, 85, 105);
    doc.text(String(item.quantity), colPositions.qty + 3, currentY + 5.5);
    doc.text(formatCurrency(item.unitPrice), colPositions.unit, currentY + 5.5);
    doc.text(item.discountPercent > 0 ? `${item.discountPercent}%` : '-', colPositions.disc + 2, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(item.subtotal), colPositions.subtotal - 2, currentY + 5.5, { align: 'right' });

    currentY += rowHeight;
  });

  currentY += 6;

  // Ensure space for totals & signatures
  if (currentY + 80 > pageHeight - 15) {
    doc.addPage();
    currentY = 20;
  }

  // Totals Area (Right aligned)
  const totalsBoxWidth = 78;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  const showIva = quote.applyIva !== false && quote.taxAmount > 0;
  const showIsr = Boolean(quote.applyIsr && quote.isrAmount && quote.isrAmount > 0);
  
  let lineCount = 2; // subtotal and total
  if (quote.discountTotal > 0) lineCount++;
  if (showIva) lineCount++;
  if (showIsr) lineCount++;
  const boxHeight = Math.max(34, lineCount * 6 + 12);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, currentY, totalsBoxWidth, boxHeight, 2, 2, 'FD');

  const totalItem = (label: string, value: string, yPos: number, isBold: boolean = false, isAccent: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9.5 : 8);
    if (isAccent) {
      doc.setTextColor(39, 24, 113); // RAWI Indigo
    } else {
      doc.setTextColor(71, 85, 105);
    }
    doc.text(label, totalsBoxX + 4, yPos);
    doc.text(value, pageWidth - margin - 4, yPos, { align: 'right' });
  };

  let rowY = currentY + 6;
  totalItem('Subtotal Bruto:', formatCurrency(quote.subtotal), rowY);

  if (quote.discountTotal > 0) {
    rowY += 5.5;
    totalItem('Descuento Total:', `-${formatCurrency(quote.discountTotal)}`, rowY);
  }

  if (showIva) {
    rowY += 5.5;
    totalItem(`(+) IVA (${quote.taxRate}%):`, formatCurrency(quote.taxAmount), rowY);
  }

  if (showIsr) {
    rowY += 5.5;
    totalItem(`(-) Retención ISR (${quote.isrRate || 1.25}%):`, `-${formatCurrency(quote.isrAmount || 0)}`, rowY);
  }

  // Line before Total
  rowY += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsBoxX + 4, rowY, pageWidth - margin - 4, rowY);

  rowY += 5.5;
  totalItem('TOTAL NETO (MXN):', formatCurrency(quote.total), rowY, true, true);

  // Additional Notes (Left side of totals)
  const termsWidth = contentWidth - totalsBoxWidth - 8;
  let leftSectionEndY = currentY;

  if (quote.notes) {
    const notesStartY = currentY + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(39, 24, 113);
    doc.text('NOTAS ADICIONALES:', margin, notesStartY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const notesLines = doc.splitTextToSize(quote.notes, termsWidth);
    doc.text(notesLines, margin, notesStartY + 5);
    leftSectionEndY = notesStartY + 5 + notesLines.length * 4;
  }

  currentY = Math.max(currentY + boxHeight + 8, leftSectionEndY + 8);

  // Signatures / Acceptance Block
  doc.setDrawColor(203, 213, 225);
  const sigWidth = (contentWidth - 20) / 2;

  // Emisor Signature
  doc.line(margin + 10, currentY + 14, margin + sigWidth, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(39, 24, 113);
  doc.text(company.name, margin + sigWidth / 2, currentY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma y Autorización Comercial', margin + sigWidth / 2, currentY + 23, { align: 'center' });

  // Client Signature (Contacto Principal)
  const clientSigX = margin + sigWidth + 20;
  doc.line(clientSigX, currentY + 14, clientSigX + sigWidth - 10, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(quote.clientName || quote.clientCompany, clientSigX + (sigWidth - 10) / 2, currentY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Aceptación de Oferta y Firma Conforme', clientSigX + (sigWidth - 10) / 2, currentY + 23, { align: 'center' });

  // =========================================================================
  // ANEXO FINAL: TÉRMINOS, CONDICIONES Y CLÁUSULAS COMERCIALES (RAWI.MX)
  // =========================================================================
  doc.addPage();

  const renderTermsHeader = () => {
    doc.setFillColor(39, 24, 113);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setFillColor(0, 245, 212);
    doc.rect(0, 18, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TÉRMINOS, CONDICIONES Y CLÁUSULAS DEL SERVICIO', margin, 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 245, 212);
    doc.text(`Cotización N° ${quote.code}`, pageWidth - margin, 11.5, { align: 'right' });

    return 26;
  };

  let tcY = renderTermsHeader();
  const bottomLimit = pageHeight - 16;

  const ensureTermsSpace = (neededHeight: number) => {
    if (tcY + neededHeight > bottomLimit) {
      doc.addPage();
      tcY = renderTermsHeader();
    }
  };

  const drawParagraph = (text: string, fontSize = 7.6, isBold = false, color: [number, number, number] = [51, 65, 85], extraGap = 2) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 0.45;
    ensureTermsSpace(lines.length * lineHeight + extraGap);
    doc.text(lines, margin, tcY);
    tcY += lines.length * lineHeight + extraGap;
  };

  const drawSectionTitle = (title: string) => {
    ensureTermsSpace(11);
    tcY += 1.5;
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin, tcY - 3.6, contentWidth, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(39, 24, 113);
    doc.text(title, margin + 2.5, tcY + 0.4);
    tcY += 5.2;
  };

  type ClauseItem = {
    num: string;
    text: string;
    bullets?: string[];
  };

  const drawClause = (clause: ClauseItem) => {
    const numColWidth = 11;
    const textWidth = contentWidth - numColWidth;
    const fontSize = 7.4;
    const lineHeight = fontSize * 0.44;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    const textLines = doc.splitTextToSize(clause.text, textWidth);
    const firstBlockHeight = textLines.length * lineHeight + 1.4;

    ensureTermsSpace(firstBlockHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(39, 24, 113);
    doc.text(clause.num, margin + 1, tcY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(textLines, margin + numColWidth, tcY);
    tcY += firstBlockHeight;

    if (clause.bullets && clause.bullets.length > 0) {
      const bulletIndent = numColWidth + 4;
      const bulletWidth = contentWidth - bulletIndent;
      clause.bullets.forEach((b) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        const bLines = doc.splitTextToSize(b, bulletWidth);
        const bHeight = bLines.length * (7.2 * 0.44) + 1.2;
        ensureTermsSpace(bHeight);
        doc.setTextColor(39, 24, 113);
        doc.text('-', margin + numColWidth + 1, tcY);
        doc.setTextColor(71, 85, 105);
        doc.text(bLines, margin + bulletIndent, tcY);
        tcY += bHeight;
      });
    }
  };

  // Intro paragraph
  drawParagraph(
    'Este presupuesto tiene una validez de 15 días desde la fecha de este, una vez pasando esta fecha la cotización pierde validez y puede ser nuevamente reformulada. Los Descuento de la cotización tiene una valides de 24 horas después de la entrega. Esta cotización está basada de acuerdo con herramientas a utilizar (cámaras, luces, micrófonos, dron, computadora, etc.), conocimiento, planeación, asesoramiento de los expertos, desarrollo de horas/hombre en pre-producción, producción y postproducción, esto aumentando que responde a un momento concreto y a unas necesidades basadas en el tipo de empresa, el sector y la futura explotación de la solución aportada.',
    7.6,
    false,
    [51, 65, 85],
    3.5
  );

  // Payment Account Card
  ensureTermsSpace(27);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, tcY, contentWidth, 21, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(39, 24, 113);
  doc.text('Cuenta para pago en transferencias:', margin + 3.5, tcY + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Banco: BBVA', margin + 3.5, tcY + 9.2);
  doc.text('Nombre del beneficiario: Camilo Michel Paz García', margin + 3.5, tcY + 13.2);
  doc.text('No. De tarjeta: 4152 3142 2717 2692', margin + 3.5, tcY + 17.2);
  doc.text('Clabe: 0121 8001 5174 7000 58', margin + contentWidth / 2, tcY + 17.2);

  tcY += 24;

  drawParagraph('www.rawi.mx // Facebook: Rawi.mx // Instagram: rawi.mx', 7.5, true, [39, 24, 113], 3);

  // Section 1: General Clauses (I - XII)
  drawSectionTitle('LA ACEPTACIÓN DE ESTE PRESUPUESTO LLEVA IMPLÍCITO EL CUMPLIMIENTO DE LAS SIGUIENTES CLÁUSULAS:');
  const generalClauses: ClauseItem[] = [
    {
      num: 'I.',
      text: 'Este presupuesto se estima con base a las horas/hombre que se desarrollará dicho proyecto y de acuerdo con la CDCV (Cámara de Diseñadores en Comunicación Visual).',
    },
    {
      num: 'II.',
      text: 'Si una vez iniciado el proyecto el Cliente decidiera rescindir el contrato y no seguir trabajando con RAWI.MX, no se le reembolsará el porcentaje adelantado y se liquidará en su 100% la totalidad el proyecto presupuestado.',
    },
    {
      num: 'III.',
      text: 'RAWI.MX se compromete a la creación, desarrollo y gestión del proyecto en el plazo acordado, siempre y cuando cuente con todo el material e información necesarios para realizar el proyecto por parte del Cliente.',
    },
    {
      num: 'IV.',
      text: 'El Cliente adquiere la responsabilidad de revisar el diseño, los textos y datos antes de empezar cualquier proceso de impresión, reproducción y/o publicación, y libera a RAWI.MX de cualquier responsabilidad por los errores que se pudieran producir y siempre y cuando no los hubiese comunicado con anterioridad y RAWI.MX no los hubiese tenido en cuenta por error.',
    },
    {
      num: 'V.',
      text: 'Las propuestas presentadas por RAWI.MX y no aceptadas por el Cliente, implican la renuncia a cualquier derecho sobre ellas, quedando a disposición de RAWI.MX, como autor de estas, el uso que libremente desee o crea más conveniente.',
    },
    {
      num: 'VI.',
      text: 'RAWI.MX podrá mostrar, siempre que lo crea conveniente, los trabajos realizados en la web del estudio "WWW.RAWI.MX" así como en otras plataformas como Youtube, Instragram, Linkedin o Facebook.',
    },
    {
      num: 'VII.',
      text: 'Este acuerdo no incluye los trabajos adicionales que se puedan derivar de los cambios de orientación en su desarrollo por parte del Cliente; si se diera el caso, RAWI.MX tendrá que informar al cliente y podrá modificar el presupuesto añadiendo los incrementos en el importe que se hubieran producido o se pudieran producir, pero manteniendo los mismos criterios de valoración utilizados en el primer presupuesto.',
    },
    {
      num: 'VIII.',
      text: 'Traducciones de textos, fotografías y/o cualquier servicio derivado del proyecto y al margen de este contrato serán facilitadas por el Cliente o bien serán presupuestadas aparte.',
    },
    {
      num: 'IX.',
      text: 'Los derechos de explotación de la solución aportada pertenecen a RAWI.MX hasta que el Cliente no haya efectuado el 100% del pago.',
    },
    {
      num: 'X.',
      text: 'Una vez terminado el proyecto y entregado al cliente, el tiempo de límite del respaldo de el/los archivos en nuestro disco duro de almacenamiento serán de un limite no mayor de 3 meses, una vez sobrepasado este tiempo, los archivos del proyecto serán eliminados definitivamente de la base de datos, esto debido al constante uso por otros proyectos.',
    },
    {
      num: 'XI.',
      text: 'Si el cliente pierde el contenido entregado y requiere un contenido de respaldo, dichos archivos tendrán un costo adicional por cuota de almacenamiento.',
    },
    {
      num: 'XII.',
      text: 'Los precios de todos nuestros servicios son modificados cada temporada; durante el proceso de cambio de precios, RAWI.MX se pondrá en contacto anticipado con el cliente, para comunicarle los cambios proporcionados.',
    },
  ];
  generalClauses.forEach(drawClause);

  // Section 2: Ads / SEM (XIII - XVII)
  drawSectionTitle('PARA CAMPAÑAS PUBLICITARIAS (ADS / SEM):');
  const adsClauses: ClauseItem[] = [
    {
      num: 'XIII.',
      text: 'Alcance, Segmentación y Presupuesto:',
      bullets: [
        'Ámbito: Válido solo para difusión local en negocios de alta rotación (alimentos, estética, gimnasios, retail, etc.). Giros B2B o industriales requieren cotización especial.',
        'Consumo: Si la pauta publicitaria se agota antes del plazo previsto, el servicio se dará por concluido exitosamente sin obligación de extenderlo.',
      ],
    },
    {
      num: 'XIV.',
      text: 'Servicios Incluidos:',
      bullets: [
        'Creatividad: Diseño y adaptación de piezas visuales y de video.',
        'Configuración técnica: Montaje, segmentación y parametrización de campañas.',
        'Optimización: Monitoreo analítico y ajustes continuos para maximizar resultados.',
      ],
    },
    {
      num: 'XV.',
      text: 'Objetivo y Cierre de Ventas El servicio se enfoca exclusivamente en la generación de prospectos (leads). El seguimiento, atención y cierre de ventas es responsabilidad total del Cliente; La Agencia no interviene en el proceso comercial final.',
    },
    {
      num: 'XVI.',
      text: 'Continuidad del Servicio Bloqueos, fallas en métodos de pago o problemas en las cuentas del Cliente no son responsabilidad de La Agencia. El tiempo contractual seguirá corriendo sin pausas en honorarios ni reposición de plazos mientras se solucionen.',
    },
    {
      num: 'XVII.',
      text: 'Limitación de Responsabilidad La Agencia aplica las mejores prácticas, pero no garantiza un volumen específico de ventas. El resultado depende de factores ajenos como:',
      bullets: [
        'Comportamiento y demanda del mercado.',
        'Cambios en algoritmos, políticas o costos de subasta de las plataformas.',
        'Rapidez y calidad en la atención comercial que el Cliente dé a los prospectos.',
      ],
    },
  ];
  adsClauses.forEach(drawClause);

  // Section 3: Gestión de Redes Sociales (I - VI)
  drawSectionTitle('PARA GESTIÓN DE REDES SOCIALES:');
  const socialClauses: ClauseItem[] = [
    {
      num: 'I.',
      text: 'Para empezar el desarrollo de planeación es necesario que el cliente otorgue información fundamental de la empresa como manual identidad de la marca e información esencial.',
    },
    {
      num: 'II.',
      text: 'El tiempo de producción es de aproximadamente dos semanas.',
    },
    {
      num: 'III.',
      text: 'El servicio de gestión de redes NO cierra la venta, ni da seguimiento a los prospectos.',
    },
    {
      num: 'IV.',
      text: 'El equipo de RAWI.MX tendrá libertad creativa para el desarrollo del contenido para el negocio, esto con el fin de agilizar el tiempo de producción de contenido.',
    },
    {
      num: 'V.',
      text: 'Para finalizar el servicio de gestión de redes sociales con el cliente deberá haber liquidado completamente el tiempo presupuestado comprometido si desea concluir los servicios.',
    },
    {
      num: 'VI.',
      text: 'En nuestro servicio de contenido para redes sociales, La cantidad del contenido acordado en la cotización debe consumirse en el tiempo del servicio acordado. Si el contenido por alguna razón no se produce en el tiempo acordado debido a decisiones ajenas a "Rawi.mx", el servicio quedará como concluido al terminar el periodo del servicio.',
    },
  ];
  socialClauses.forEach(drawClause);

  // Section 4: Desarrollo Web (VII - XX)
  drawSectionTitle('PARA SERVICIO DE DESARROLLO WEB:');
  const webClauses: ClauseItem[] = [
    {
      num: 'VII.',
      text: 'Dentro de nuestros servicios de diagnostico web tendremos confidencialidad total, sus accesos son tratados con ética profesional; solo el personal técnico asignado entrará para diagnosticar, nunca para compartir. No alteraremos datos ni configuraciones ajenas al fallo. Entramos exclusivamente para identificar la solución, dejando su información intacta.',
    },
    {
      num: 'VIII.',
      text: 'Nos comprometemos a entregar la página web en la fecha acordada, siempre y cuando el cliente proporcione oportunamente todo el material necesario y realice las revisiones y aprobaciones en los plazos establecidos.',
    },
    {
      num: 'IX.',
      text: 'Nuestro proceso de desarrollo web se concentra en nuestro proceso, desde el brainstorming, construcción, retroalimentación por parte del cliente, test a usuarios, afinación y conclusión.',
    },
    {
      num: 'X.',
      text: 'Si el cliente no proporciona el material, la retroalimentación o las correcciones dentro de los plazos acordados, el proyecto se considerará finalizado en el tiempo establecido, y se liquidará conforme a los términos de pago acordados.',
    },
    {
      num: 'XI.',
      text: 'El tiempo de servicio comienza a partir que se obtiene la compra del dominio.',
    },
    {
      num: 'XII.',
      text: 'Antes de la entrega final, el cliente se le ofrecen una cantidad límite de correcciones estéticas, estas correcciones no incluyen rediseño completo de la web.',
    },
    {
      num: 'XIII.',
      text: 'Modificaciones después de la entrega tiene costo extra.',
    },
    {
      num: 'XIV.',
      text: 'Si el cliente requiere gestionar su propia web, sin necesidad de ayuda del técnico creador; RAWI.mx le ofrece una serie de videos tutoriales para facilitar la gestión de su web, esto con un costo adicional.',
    },
    {
      num: 'XV.',
      text: 'Todos los paquetes ofertados incluyen desarrollo de texto e imágenes libres de derecho de autor, estos ya establecidas por un proveedor de stock. En caso de que el cliente requiera crear contenido único como diseño de material audiovisual entre otros, este tendrá un costo extra independiente de el/los paquetes.',
    },
    {
      num: 'XVI.',
      text: 'Anexar aplicaciones independientes ajenos al paquete original tiene un costo extra.',
    },
    {
      num: 'XVII.',
      text: 'El hosting, dominio y SSL son otorgados por el servidor propio de RAWI.mx, en caso de que se trabaje en un hosting ajeno, el servicio de mantenimiento y monitoreo queda anulado.',
    },
    {
      num: 'XVIII.',
      text: 'El costo del servicio de hosting, dominio y SSL tiene un costo de renta de renovación anual.',
    },
    {
      num: 'XIX.',
      text: 'Si el Cliente no realiza el pago total al concluir el proyecto de desarrollo web, dispondrá de un período de gracia de 30 días para efectuarlo. Pasado este plazo, se aplicará un interés moratorio del 20% mensual sobre el monto adeudado. Además, el proveedor se reserva el derecho de suspender todos los servicios prestados al Cliente hasta que se reciba el pago completo, incluyendo los intereses acumulados y cualquier cargo adicional.',
    },
    {
      num: 'XX.',
      text: 'Si el cliente no efectúa la renovación anual; el dominio y el contenido de la web serán depurados sin recuperación alguna.',
    },
  ];
  webClauses.forEach(drawClause);

  // Section 5: Vuelo con Dron (XXI - XXVI)
  drawSectionTitle('PARA SERVICIO DE VUELO CON DRON:');
  const droneClauses: ClauseItem[] = [
    {
      num: 'XXI.',
      text: 'El cliente tiene la responsabilidad de pedir los permisos necesarios para realizar la filmación correctamente en la locación que se realizará con el dron.',
    },
    {
      num: 'XXII.',
      text: 'El máximo vuelo preferentemente debe ser no más a 300 metros de altura.',
    },
    {
      num: 'XXIII.',
      text: 'El tiempo de ráfaga de viento no debe superar los 35 km/h.',
    },
    {
      num: 'XXIV.',
      text: 'Si el día de la filmación el clima se encuentra fuera de los estándares habituales; el vuelo será postergado.',
    },
    {
      num: 'XXV.',
      text: 'El cliente tiene la responsabilidad de dirigir al piloto del dron a la ubicación en donde a se realizará el despegue del dron.',
    },
    {
      num: 'XXVI.',
      text: 'Si surge algún accidente dentro del trabajo de vuelo y el dron queda indispuesto, la filmación, fotografía o levantamiento se dará por concluido y se liquidará el resto el proyecto presupuestado.',
    },
  ];
  droneClauses.forEach(drawClause);

  // Render consistent Footer Bar on ALL pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`${company.name} | ${company.website} | Tel: ${company.phone}`, margin, pageHeight - 5);
    doc.text(`Página ${p} de ${totalPages} • Documento generado confidencialmente por ${company.name}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  // Save the PDF
  const cleanFilename = `${quote.code}_Cotizacion_${(quote.clientCompany || quote.clientName).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(cleanFilename);
}
