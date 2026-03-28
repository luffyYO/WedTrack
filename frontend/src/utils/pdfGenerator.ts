import { formatDate } from './formatters';

interface GuestExportData {
  fullname: string;
  father_fullname?: string;
  phone_number: string;
  village?: string;
  amount: number | string;
  payment_type: string;
  is_paid: boolean;
  created_at: string;
}

interface ExportSummary {
  weddingName: string;
  totalGifts: number;
  totalAmount: number;
}

// jsPDF and autoTable are dynamically imported so they stay out of the initial
// bundle (~422KB saved). They only download the first time a user clicks Download.
export const generateGuestListPDF = async (guests: GuestExportData[], summary: ExportSummary) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const today = formatDate(new Date().toISOString());

  const addDesignEdges = () => {
    // Outer elegant gold line
    doc.setDrawColor(212, 175, 55); // #D4AF37
    doc.setLineWidth(0.6);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner stitched (dashed) indigo line
    doc.setDrawColor(79, 70, 229); // #4F46E5
    doc.setLineWidth(0.3);
    if (typeof (doc as any).setLineDashPattern === 'function') {
      (doc as any).setLineDashPattern([2, 2], 0);
    }
    doc.rect(11, 11, pageWidth - 22, pageHeight - 22);
    if (typeof (doc as any).setLineDashPattern === 'function') {
      (doc as any).setLineDashPattern([], 0); // Restore default
    }
    
    // Thicker Corner Accents for a premium invitation look
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.2);
    const cornerSize = 8;
    // Top-Left
    doc.line(8, 8 + cornerSize, 8, 8);
    doc.line(8, 8, 8 + cornerSize, 8);
    // Top-Right
    doc.line(pageWidth - 8, 8 + cornerSize, pageWidth - 8, 8);
    doc.line(pageWidth - 8, 8, pageWidth - 8 - cornerSize, 8);
    // Bottom-Left
    doc.line(8, pageHeight - 8 - cornerSize, 8, pageHeight - 8);
    doc.line(8, pageHeight - 8, 8 + cornerSize, pageHeight - 8);
    // Bottom-Right
    doc.line(pageWidth - 8, pageHeight - 8 - cornerSize, pageWidth - 8, pageHeight - 8);
    doc.line(pageWidth - 8, pageHeight - 8, pageWidth - 8 - cornerSize, pageHeight - 8);
  };

  addDesignEdges(); // Draw immediately on Page 1

  // 1. Title & Branding (Centered)
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo/Purple color
  doc.text('Wedding Gift Report', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`${summary.weddingName} Wedding`, pageWidth / 2, 32, { align: 'center' });

  // 2. Summary Block
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(252, 251, 255);
  doc.roundedRect(14, 42, pageWidth - 28, 30, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Gifts Collected:`, 20, 52);
  doc.text(`Total Amount Collected:`, 20, 62);
  doc.text(`Report Generated On:`, pageWidth - 20, 52, { align: 'right' });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`${summary.totalGifts}`, 60, 52);
  doc.text(`Rs. ${summary.totalAmount.toLocaleString('en-IN')}`, 60, 62);
  doc.text(today, pageWidth - 20, 62, { align: 'right' });

  // 3. Table Preparation
  const tableColumn = [
    "Guest Name", 
    "Father's Name", 
    "Phone / Location", 
    "Amount (Rs.)", 
    "Date", 
    "Status"
  ];
  
  const tableRows = guests.map(guest => {
    const formattedAmount = `${Number(guest.amount).toLocaleString('en-IN')}`;
    
    return [
      guest.fullname,
      guest.father_fullname || '—',
      `${guest.phone_number}${guest.village ? ` / ${guest.village}` : ''}`,
      `Rs. ${formattedAmount}`,
      formatDate(guest.created_at),
      guest.is_paid ? 'Verified' : 'Pending'
    ];
  });

  // 4. Generate Table with Styling
  autoTable(doc, {
    startY: 82,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [79, 70, 229], // Indigo-600
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      3: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'center' },
      5: { halign: 'center' }
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60],
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252]
    },
    margin: { top: 25, bottom: 25, left: 18, right: 18 }, // Moved inside borders a bit more
    didDrawPage: (data: { pageNumber: number }) => {
      addDesignEdges();

      if (data.pageNumber > 1) {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Wedding Gift Report — ${summary.weddingName}`, 14, 15);
        doc.setDrawColor(240, 240, 240);
        doc.line(14, 18, pageWidth - 14, 18);
      }
      
      const totalPages = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      const str = `Page ${data.pageNumber} of ${totalPages}`;
      doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.text(`Generated by WedTrack`, 14, doc.internal.pageSize.getHeight() - 10);
    }
  });

  // 5. Finalize and Save
  const fileName = `guest-list-${summary.weddingName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};
