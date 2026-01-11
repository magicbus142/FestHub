import jsPDF from 'jspdf';
import { Donation } from '@/lib/database';

export interface ReceiptConfig {
    title?: string;
    sub_title?: string;
    footer_text?: string;
    show_logo?: boolean;
    show_date?: boolean;
    show_receipt_no?: boolean;
    organization_name?: string; 
    layout?: 'standard' | 'table';
    theme?: 'saffron' | 'blue' | 'green' | 'rose';
}

const THEMES = {
    saffron: { primary: [255, 153, 51], light: [255, 245, 230] }, // #FF9933
    blue: { primary: [37, 99, 235], light: [239, 246, 255] },     // #2563EB
    green: { primary: [5, 150, 105], light: [236, 253, 245] },    // #059669
    rose: { primary: [225, 29, 72], light: [255, 241, 242] },     // #E11D48
};

export const generateReceipt = (donation: Donation, config: ReceiptConfig) => {
    const theme = THEMES[config.theme || 'saffron'];

    if (config.layout === 'table') {
        renderTableLayout(donation, config, theme);
    } else {
        renderStandardLayout(donation, config, theme);
    }
};

const drawPageBorder = (doc: jsPDF, width: number, height: number, color: number[]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(1);
    doc.rect(5, 5, width - 10, height - 10);
    doc.rect(7, 7, width - 14, height - 14);
};

const renderStandardLayout = (donation: Donation, config: ReceiptConfig, theme: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  const primaryColor = theme.primary;
  const darkColor = [50, 50, 50]; 

  // Decorative Border
  drawPageBorder(doc, pageWidth, pageHeight, primaryColor);

  let currentY = 25;

  // Header Background
  doc.setFillColor(theme.light[0], theme.light[1], theme.light[2]);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, 10, pageWidth - 20, 35, 'FD'); // Fill and Draw

  // Header Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const title = config.title || config.organization_name || 'Festival Receipt';
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;
  
  // Sub Title
  if (config.sub_title) {
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(config.sub_title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
  }

  // Divider Line
  currentY = 55; // Reset below header block
  
  // Receipt Generic Details (Right alignedish)
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(10);
  
  const dateStr = new Date(donation.created_at || new Date()).toLocaleDateString();
  const receiptNo = donation.id?.slice(0, 8).toUpperCase();

  if (config.show_date !== false) {
      doc.text(`Date: ${dateStr}`, pageWidth - 25, currentY, { align: 'right' });
  }
  if (config.show_receipt_no !== false) {
      doc.text(`Receipt No: #${receiptNo}`, 25, currentY);
  }
  
  // PAYMENT STATUS INDICATOR (For Cash)
  const isCash = !donation.donation_mode || donation.donation_mode === 'cash';
  const received = donation.received_amount || 0;
  const total = donation.amount;
  const pending = total - received;

  if (isCash && total > 0) {
      currentY += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      if (pending > 0) {
          doc.setTextColor(220, 38, 38); // Red for Pending
          doc.text(`PAYMENT PENDING: Rs. ${pending.toLocaleString()}/-`, pageWidth - 25, currentY, { align: 'right' });
      } else {
          doc.setTextColor(22, 163, 74); // Green for Paid
          doc.text(`PAID IN FULL`, pageWidth - 25, currentY, { align: 'right' });
      }
      // Reset
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]); 
      doc.setFont('helvetica', 'normal');
      currentY -= 10; // Reset Y so main content flows normally, this was a side-label
  }
  
  currentY += 25;
  
  // Main Content
  const donorName = donation.name_english || donation.name || 'Donor';
  
  doc.setFontSize(12);
  doc.text(`Received with thanks from:`, 25, currentY);
  currentY += 10;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(donorName, 25, currentY);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  currentY += 20;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  const amountText = `The Sum of Rupees: ${donation.amount.toLocaleString()}/-`;
  doc.text(amountText, 25, currentY);
  currentY += 15;
  
  const description = donation.category === 'sponsorship' 
    ? `Towards: Sponsorship - ${donation.type}`
    : `Towards: Festival Contribution`;
    
  doc.text(description, 25, currentY); 
  currentY += 20;
  
  // Amount Box
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(25, currentY, 80, 25, 3, 3, 'FD');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Rs. ${donation.amount.toLocaleString()}/-`, 65, currentY + 16, { align: 'center' });
  
  // Footer Section
  const footerY = 250; 
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Authorized Signature', pageWidth - 60, footerY - 20);
  doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 60, footerY - 25, pageWidth - 25, footerY - 25);
  
  doc.setFont('helvetica', 'normal');
  
  if (config.footer_text) {
      doc.text(config.footer_text, pageWidth / 2, footerY, { align: 'center' });
  } else {
      doc.text('Thank you for your generous contribution!', pageWidth / 2, footerY, { align: 'center' });
  }
  
  doc.save(`Receipt_${donorName.replace(/\s+/g, '_')}_${donation.id?.slice(0,6)}.pdf`);
};

const renderTableLayout = (donation: Donation, config: ReceiptConfig, theme: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    const primaryColor = theme.primary;
    const darkColor = [50, 50, 50];

    // Decorative Border
    drawPageBorder(doc, pageWidth, pageHeight, primaryColor);

    let currentY = 25;

    // Header Background (Same as Standard for consistency)
    doc.setFillColor(theme.light[0], theme.light[1], theme.light[2]);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, pageWidth - 20, 35, 'FD');

    // Header Title
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const title = config.title || config.organization_name || 'Charitable Donation Receipt';
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Sub Title
    if (config.sub_title) {
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(config.sub_title, pageWidth / 2, currentY, { align: 'center' });
    }

    currentY = 60; // Start body content below header

    // Date Line
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (config.show_date !== false) {
        const dateStr = new Date(donation.created_at || new Date()).toLocaleDateString();
        doc.text('Date:', pageWidth - 80, currentY);
        doc.line(pageWidth - 65, currentY, pageWidth - 25, currentY); // Line for date
        doc.text(dateStr, pageWidth - 60, currentY - 2);
    }
    
    currentY += 20;

    // Received of
    const donorName = donation.name_english || donation.name || 'Donor';
    doc.text('Received of:', 25, currentY);
    doc.line(55, currentY, pageWidth - 25, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(donorName, 60, currentY - 2);
    currentY += 20;

    // Table Grid
    const startX = 25;
    const endX = pageWidth - 25;
    const rowHeight = 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(0); // Black lines for table inner, or use theme? Let's use black for contrast.
    
    // Grid Lines
    // Top line
    doc.line(startX, currentY, endX, currentY);
    
    // Rows
    const rows = ['Goods', 'Services', 'Cash'];
    
    rows.forEach((rowLabel, index) => {
        const rowY = currentY + ((index + 1) * rowHeight);
        
        // Horizontal line
        doc.line(startX, rowY, endX, rowY);
        
        // Vertical lines
        doc.line(startX, currentY, startX, rowY); // Left
        doc.line(startX + 40, currentY, startX + 40, rowY); // Label Separator
        doc.line(endX - 40, currentY, endX - 40, rowY); // Amount Separator
        doc.line(endX, currentY, endX, rowY); // Right
        
        // Row Label
        doc.text(rowLabel, startX + 2, currentY + 10);
        
        // --- LOGIC FOR FILLING ROWS ---
        const mode = (donation.donation_mode || 'cash').toLowerCase();
        const fillRow = 
            (rowLabel === 'Goods' && mode === 'goods') ||
            (rowLabel === 'Services' && mode === 'service') || // 'service' is db val
            (rowLabel === 'Cash' && mode === 'cash');

        if (fillRow) {
             // For Cash, we show Amount. For Goods/Service, we show "Item Name" (donation.type) and optionally value.
             
             // Description Column (Middle)
             let descriptionText = '';
             if (rowLabel === 'Cash') {
                 descriptionText = donation.category === 'sponsorship' ? `Sponsorship: ${donation.type}` : 'Festival Contribution';
             } else {
                 // For Goods/Service, the 'type' field holds the Item Name (e.g., "Rice 25kg")
                 descriptionText = donation.type;
             }
             doc.text(descriptionText, startX + 42, currentY + 10);

             // Amount Column (Right)
             // Only show Amount if > 0. For Goods/Services it might be 0 or estimated value.
             if (donation.amount > 0) {
                 doc.setFont('helvetica', 'bold');
                 doc.text(`Rs. ${donation.amount.toLocaleString()}/-`, endX - 38, currentY + 10);
                 doc.setFont('helvetica', 'normal');
             }
        }
        
        currentY = rowY;
    });

    // Total Row
    const totalY = currentY + rowHeight;
    doc.line(startX, totalY, endX, totalY); // Bottom of total
     // Vertical lines for total
    doc.line(endX - 40, currentY, endX - 40, totalY); // Amount Separator
    doc.line(endX, currentY, endX, totalY); // Right
    
    // Highlight Total Box with Theme Color
    doc.setFillColor(theme.light[0], theme.light[1], theme.light[2]);
    doc.rect(endX - 40, currentY, 40, rowHeight, 'F'); // Fill total box

    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', endX - 60, currentY + 10);
    
    // Show total only if > 0
    if (donation.amount > 0) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Rs. ${donation.amount.toLocaleString()}/-`, endX - 38, currentY + 10);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]); // Reset text
    } else {
         doc.text(`-`, endX - 25, currentY + 10);
    }
    
    currentY = totalY;

    // --- PAYMENT BREAKDOWN (Received / Due) ---
    // Only relevant for Cash donations that track received_amount
    const isCash = !donation.donation_mode || donation.donation_mode === 'cash';
    
    if (isCash && donation.amount > 0) {
        // RECEIVED ROW
        doc.setDrawColor(0);
        doc.line(endX - 40, currentY, endX - 40, currentY + rowHeight); // Vertical
        doc.line(endX, currentY, endX, currentY + rowHeight); // Vertical Right
        doc.line(endX - 65, currentY + rowHeight, endX, currentY + rowHeight); // Bottom line (partial)

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Received:', endX - 63, currentY + 10);
        doc.setFontSize(12);
        const received = donation.received_amount || 0;
        doc.text(`Rs. ${received.toLocaleString()}/-`, endX - 38, currentY + 10);
        
        currentY += rowHeight;

        // DUE ROW (Only if there is due)
        const due = donation.amount - received;
        if (due > 0) {
             doc.line(endX - 40, currentY, endX - 40, currentY + rowHeight); // Vertical
             doc.line(endX, currentY, endX, currentY + rowHeight); // Vertical Right
             doc.line(endX - 65, currentY + rowHeight, endX, currentY + rowHeight); // Bottom line
             
             doc.setTextColor(220, 38, 38); // Red
             doc.text('Balance Due:', endX - 63, currentY + 10);
             doc.setFont('helvetica', 'bold');
             doc.text(`Rs. ${due.toLocaleString()}/-`, endX - 38, currentY + 10);
             doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]); // Reset
             
             currentY += rowHeight;
        }
    }
    
    currentY += 10;
    
    // Footer Signature
    const footerY = pageHeight - 40;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    if (config.footer_text) {
        doc.text(config.footer_text, pageWidth / 2, footerY - 30, { align: 'center' });
    }

    doc.text('Authorized Signature', pageWidth - 80, footerY);
    doc.line(pageWidth - 80, footerY - 5, pageWidth - 25, footerY - 5);

    doc.save(`Receipt_${donorName.replace(/\s+/g, '_')}_${donation.id?.slice(0,6)}.pdf`);
};
