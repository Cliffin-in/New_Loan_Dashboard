// src/services/pdfService.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const generateTermSheetPdf = (termSheetData) => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add LFG Logo
    // Note: In a real implementation, you would need to import the logo as a base64 string
    // For now, we'll just add a placeholder for the logo
    doc.setFontSize(22);
    doc.setTextColor(73, 196, 174); // LFG teal color
    doc.text("LFG Lending", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Lawrence Financial Group", 14, 28);
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Term Sheet", doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    // Deal Info Section
    doc.setFillColor(200, 230, 230);
    doc.rect(10, 35, doc.internal.pageSize.width - 20, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Deal Info", doc.internal.pageSize.width / 2, 42, { align: 'center' });
    
    // Deal Info Table
    doc.autoTable({
      startY: 45,
      head: [],
      body: [
        [{ content: 'Borrower:', styles: { fontStyle: 'bold' } }, termSheetData.borrower || '', 
         { content: 'Property Address:', styles: { fontStyle: 'bold' } }, termSheetData.propertyAddress || '']
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      }
    });
    
    // Deal Structure Section
    const dealStructureY = doc.previousAutoTable.finalY + 5;
    doc.setFillColor(200, 230, 230);
    doc.rect(10, dealStructureY, doc.internal.pageSize.width - 20, 10, 'F');
    doc.text("Deal Structure", doc.internal.pageSize.width / 2, dealStructureY + 7, { align: 'center' });
    
    // Deal Structure Table
    doc.autoTable({
      startY: dealStructureY + 10,
      head: [],
      body: [
        [{ content: 'Loan Purpose:', styles: { fontStyle: 'bold' } }, termSheetData.loanPurpose || ''],
        [{ content: 'Loan Amount:', styles: { fontStyle: 'bold' } }, termSheetData.loanAmount || '',
         { content: 'As-Is Value/ Purchase Price:', styles: { fontStyle: 'bold' } }, termSheetData.asIsValue || ''],
        [{ content: 'Loan to Value:', styles: { fontStyle: 'bold' } }, termSheetData.loanToValue || '',
         { content: 'Rehab Cost (if applicable):', styles: { fontStyle: 'bold' } }, termSheetData.rehabCost || ''],
        [{ content: '', styles: { fontStyle: 'bold' } }, '',
         { content: 'After Repaired Value (if applicable):', styles: { fontStyle: 'bold' } }, termSheetData.afterRepairedValue || '']
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      }
    });
    
    // Loan Terms Section
    const loanTermsY = doc.previousAutoTable.finalY + 5;
    doc.setFillColor(200, 230, 230);
    doc.rect(10, loanTermsY, doc.internal.pageSize.width - 20, 10, 'F');
    doc.text("Loan Terms", doc.internal.pageSize.width / 2, loanTermsY + 7, { align: 'center' });
    
    // Loan Terms Table
    doc.autoTable({
      startY: loanTermsY + 10,
      head: [],
      body: [
        [{ content: 'Loan Type:', styles: { fontStyle: 'bold' } }, termSheetData.loanType || '',
         { content: 'Interest Rate:', styles: { fontStyle: 'bold' } }, termSheetData.interestRate || ''],
        [{ content: 'Monthly Payment (principal & interest only):', styles: { fontStyle: 'bold' } }, termSheetData.monthlyPayment || '',
         { content: 'PrePayment Penalty:', styles: { fontStyle: 'bold' } }, termSheetData.prePaymentPenalty || '']
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      }
    });
    
    // Loan Fees Section
    const loanFeesY = doc.previousAutoTable.finalY + 5;
    doc.setFillColor(200, 230, 230);
    doc.rect(10, loanFeesY, doc.internal.pageSize.width - 20, 10, 'F');
    doc.text("Loan Fees", doc.internal.pageSize.width / 2, loanFeesY + 7, { align: 'center' });
    
    // Loan Fees Table
    doc.autoTable({
      startY: loanFeesY + 10,
      head: [],
      body: [
        [{ content: 'Origination Cost:', styles: { fontStyle: 'bold' } }, termSheetData.originationCost || '',
         { content: 'Cash To(-)/ From(+) Borrower:*', styles: { fontStyle: 'bold' } }, termSheetData.cashToBorrower || ''],
        [{ content: 'Lender Fee:', styles: { fontStyle: 'bold' } }, termSheetData.lenderFee || '',
         { content: 'Additional Liquidity/ Reserves Required:', styles: { fontStyle: 'bold' } }, termSheetData.additionalLiquidity || ''],
        [{ content: 'Processing Fee:', styles: { fontStyle: 'bold' } }, termSheetData.processingFee || '', '', '']
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      }
    });
    
    // Loan Fees Note
    const loanFeesNoteY = doc.previousAutoTable.finalY + 2;
    doc.setFontSize(8);
    doc.text('* Cash to or from borrow listed above does not include: appraisal, closing, legal, title, and escrow related fee\'s -', 10, loanFeesNoteY);
    doc.text('for estimation of these costs, contact loan officer directly', 10, loanFeesNoteY + 4);
    
    // Add a new page if we're running out of space
    if (loanFeesNoteY + 60 > doc.internal.pageSize.height) {
      doc.addPage();
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
    }
    
    // Property Information Section
    const propertyInfoY = loanFeesNoteY + 10;
    doc.setFillColor(200, 230, 230);
    doc.rect(10, propertyInfoY, doc.internal.pageSize.width - 20, 10, 'F');
    doc.setFontSize(12);
    doc.text("Property Information", doc.internal.pageSize.width / 2, propertyInfoY + 7, { align: 'center' });
    
    // Property Information Table
    doc.autoTable({
      startY: propertyInfoY + 10,
      head: [],
      body: [
        [{ content: 'Property Type:', styles: { fontStyle: 'bold' } }, termSheetData.propertyType || '',
         { content: 'Annual Taxes:', styles: { fontStyle: 'bold' } }, termSheetData.annualTaxes || ''],
        [{ content: 'FICO Score:', styles: { fontStyle: 'bold' } }, termSheetData.ficoScore || '',
         { content: 'Annual Insurance:', styles: { fontStyle: 'bold' } }, termSheetData.annualInsurance || ''],
        [{ content: 'Fair Market Rent:', styles: { fontStyle: 'bold' } }, termSheetData.fairMarketRent || '',
         { content: 'Annual Flood Insurance:', styles: { fontStyle: 'bold' } }, termSheetData.annualFloodInsurance || ''],
        [{ content: 'Property Designation:', styles: { fontStyle: 'bold' } }, termSheetData.propertyDesignation || '',
         { content: 'Annual HOA Dues:', styles: { fontStyle: 'bold' } }, termSheetData.annualHoaDues || ''],
        [{ content: 'Bankruptcy in last 3yrs:', styles: { fontStyle: 'bold' } }, termSheetData.bankruptcyIn3Yrs || '',
         { content: 'Current DSCR:', styles: { fontStyle: 'bold' } }, termSheetData.currentDscr || ''],
        [{ content: 'Foreclosures in last 3yrs:', styles: { fontStyle: 'bold' } }, termSheetData.foreclosuresIn3Yrs || '', '', ''],
        [{ content: 'Felonies/ Crimes:', styles: { fontStyle: 'bold' } }, termSheetData.feloniesOrCrimes || '', '', '']
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      }
    });
    
    // Terms note
    const termsNoteY = doc.previousAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.text('Terms provided are an estimate and are subject to change if any of the factors listed in the deal assumptions change.', 10, termsNoteY);
    
    // Save the PDF
    const fileName = `Term_Sheet_${termSheetData.borrower.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false, error: error.message };
  }
};

export const pdfService = {
  generateTermSheetPdf
};