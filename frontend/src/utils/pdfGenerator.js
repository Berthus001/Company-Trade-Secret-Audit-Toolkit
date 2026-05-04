/**
 * PDF Report Generator
 * Generates formal audit reports with recommendations for analyst role
 * Using jsPDF directly for reliable PDF generation
 */

import { jsPDF } from 'jspdf';

/**
 * Generate and download PDF report using jsPDF directly
 */
export const downloadPDFReport = async (audit, recommendations, analystName) => {
  console.log('📄 Starting PDF generation with jsPDF');
  console.log('Audit:', audit);
  console.log('Recommendations:', recommendations);

  try {
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = margin;

    console.log('PDF initialized:', { pageWidth, pageHeight, margin });

    // Helper function to add new page
    const addNewPage = () => {
      doc.addPage();
      yPos = margin;
    };

    // Helper function to check if we need new page
    const checkNewPage = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        addNewPage();
        return true;
      }
      return false;
    };

    // Helper function for text wrapping
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * lineHeight;
    };

    // ==================== TITLE PAGE ====================
    console.log('Rendering title page...');
    
    // Title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210); // Blue
    doc.text('Trade Secret Audit Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Company name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(audit.companyName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 40;

    // Line separator
    doc.setDrawColor(25, 118, 210);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 20;

    // Metadata
    doc.setFontSize(12);
    doc.setTextColor(85, 85, 85);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const auditDate = new Date(audit.auditDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.text(`Report Generated: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`Audit Date: ${auditDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`Prepared By: ${analystName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    if (audit._id) {
      doc.setFontSize(10);
      doc.text(`Report ID: ${audit._id}`, pageWidth / 2, yPos, { align: 'center' });
    }

    console.log('Title page complete');

    // ==================== NEW PAGE: EXECUTIVE SUMMARY ====================
    addNewPage();
    console.log('Rendering executive summary...');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Executive Summary', margin, yPos);
    yPos += 10;

    // Blue line under header
    doc.setDrawColor(25, 118, 210);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Calculate summary box height dynamically
    const boxStartY = yPos;
    yPos += 12; // Top padding (increased for better centering)
    
    // Summary text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const summaryText1 = `Purpose: This report presents the findings of a comprehensive trade secret protection audit conducted for ${audit.companyName}. The audit evaluates the organization's current security posture across key areas including Access Control, Data Encryption, Employee Policies, and Physical Security.`;
    const height1 = addWrappedText(summaryText1, margin + 5, yPos, contentWidth - 10, 6);
    yPos += height1 + 6;
    
    const summaryText2 = `Overall Assessment: The audit resulted in an overall score of ${audit.percentageScore}% with a ${audit.riskLevel} risk classification. This assessment is based on the Defend Trade Secrets Act (DTSA) requirements and industry best practices for protecting proprietary information.`;
    const height2 = addWrappedText(summaryText2, margin + 5, yPos, contentWidth - 10, 6);
    yPos += height2 + 12; // Bottom padding (increased for better centering)
    
    // Draw summary box background after calculating height
    const boxHeight = yPos - boxStartY;
    doc.setFillColor(227, 242, 253); // Light blue
    doc.rect(margin, boxStartY, contentWidth, boxHeight, 'F');
    
    // Redraw text on top of background
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    let textY = boxStartY + 12;
    addWrappedText(summaryText1, margin + 5, textY, contentWidth - 10, 6);
    textY += height1 + 6;
    addWrappedText(summaryText2, margin + 5, textY, contentWidth - 10, 6);
    
    yPos += 25;  // Add more space after Executive Summary

    console.log('Executive summary complete');

    // ==================== AUDIT RESULTS ====================
    checkNewPage(80);
    console.log('Rendering audit results...');
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Audit Results', margin, yPos);
    yPos += 9;

    doc.setDrawColor(25, 118, 210);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Results cards
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    
    const cardWidth = (contentWidth - 20) / 3;
    const cardHeight = 30;
    const cardY = yPos;
    
    // Card 1: Overall Score
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.rect(margin, cardY, cardWidth, cardHeight);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Overall Score', margin + cardWidth / 2, cardY + 8, { align: 'center' });
    doc.setFontSize(24);
    doc.setTextColor(25, 118, 210);
    doc.text(`${audit.percentageScore}%`, margin + cardWidth / 2, cardY + 22, { align: 'center' });
    
    // Card 2: Risk Level
    doc.rect(margin + cardWidth + 10, cardY, cardWidth, cardHeight);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Risk Level', margin + cardWidth + 10 + cardWidth / 2, cardY + 8, { align: 'center' });
    
    // Risk level with color
    const riskColors = {
      'Low': [76, 175, 80],
      'Medium': [255, 152, 0],
      'High': [244, 67, 54]
    };
    const riskColor = riskColors[audit.riskLevel] || riskColors['Medium'];
    doc.setFontSize(16);
    doc.setTextColor(...riskColor);
    doc.text(audit.riskLevel, margin + cardWidth + 10 + cardWidth / 2, cardY + 22, { align: 'center' });
    
    // Card 3: Total Points
    doc.rect(margin + 2 * (cardWidth + 10), cardY, cardWidth, cardHeight);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Total Points', margin + 2 * (cardWidth + 10) + cardWidth / 2, cardY + 8, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(25, 118, 210);
    const totalScore = audit.totalScore || 0;
    const maxScore = audit.maxPossibleScore || audit.maxScore || 100;
    doc.text(`${totalScore} / ${maxScore}`, margin + 2 * (cardWidth + 10) + cardWidth / 2, cardY + 22, { align: 'center' });
    
    yPos += cardHeight + 20;

    console.log('Audit results complete');

    // ==================== CATEGORY BREAKDOWN ====================
    checkNewPage(100);
    console.log('Rendering category breakdown...');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Category Breakdown', margin, yPos);
    yPos += 10;

    // Table header
    const tableStartY = yPos;
    const colWidths = [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2];
    
    // Header background
    doc.setFillColor(25, 118, 210);
    doc.rect(margin, tableStartY, contentWidth, 10, 'F');
    
    // Header text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Category', margin + 2, tableStartY + 7);
    doc.text('Score', margin + colWidths[0] + 10, tableStartY + 7, { align: 'center' });
    doc.text('Percentage', margin + colWidths[0] + colWidths[1] + 10, tableStartY + 7, { align: 'center' });
    doc.text('Status', margin + colWidths[0] + colWidths[1] + colWidths[2] + 10, tableStartY + 7, { align: 'center' });
    
    yPos = tableStartY + 10;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    let rowIndex = 0;
    
    for (const [category, scores] of Object.entries(audit.categoryScores || {})) {
      checkNewPage(15);
      
      // Alternating row background
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos, contentWidth, 10, 'F');
      }
      
      doc.setFontSize(10);
      // Properly format category name: "accessControl" -> "Access Control"
      const categoryName = category
        .replace(/([A-Z])/g, ' $1')  // Add space before capitals
        .trim()                       // Remove leading space
        .replace(/^./, str => str.toUpperCase());  // Capitalize first letter
      
      doc.text(categoryName, margin + 2, yPos + 7);
      doc.text(`${scores.score} / ${scores.maxScore}`, margin + colWidths[0] + 10, yPos + 7, { align: 'center' });
      doc.text(`${scores.percentage}%`, margin + colWidths[0] + colWidths[1] + 10, yPos + 7, { align: 'center' });
      
      // Use text-only status (no emoji/symbols for PDF compatibility)
      const status = scores.percentage >= 75 ? 'Satisfactory' : 'Needs Improvement';
      doc.text(status, margin + colWidths[0] + colWidths[1] + colWidths[2] + 10, yPos + 7, { align: 'center' });
      
      yPos += 10;
      rowIndex++;
    }

    // Table border
    doc.setDrawColor(224, 224, 224);
    doc.rect(margin, tableStartY, contentWidth, yPos - tableStartY);

    yPos += 15;
    console.log('Category breakdown complete');

    // ==================== RECOMMENDATIONS ====================
    checkNewPage(60);
    console.log('Rendering recommendations...');
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Recommendations for Improvement', margin, yPos);
    yPos += 10;

    doc.setDrawColor(25, 118, 210);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Parse recommendations
    let parsedRecommendations = [];
    if (recommendations) {
      if (typeof recommendations === 'string') {
        parsedRecommendations = recommendations
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map((line, index) => ({
            title: line.trim().substring(1).trim(),
            priority: index < 3 ? 'High' : index < 6 ? 'Medium' : 'Low'
          }));
      } else if (Array.isArray(recommendations)) {
        parsedRecommendations = recommendations;
      }
    }

    if (parsedRecommendations.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      parsedRecommendations.forEach((rec, index) => {
        checkNewPage(25);
        
        // Recommendation box
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        
        // Priority badge colors
        const priorityColors = {
          'High': [211, 47, 47],
          'Medium': [245, 124, 0],
          'Low': [56, 142, 60]
        };
        const priorityColor = priorityColors[rec.priority] || priorityColors['Medium'];
        
        // Title with number
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${index + 1}.`, margin + 2, yPos + 6);
        
        // Priority badge (positioned on right)
        doc.setFillColor(...priorityColor);
        doc.roundedRect(pageWidth - margin - 28, yPos + 2, 23, 7, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(rec.priority, pageWidth - margin - 16.5, yPos + 6.5, { align: 'center' });
        
        // Recommendation text (with proper width to avoid badge)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        // Available width: from margin+10 to (pageWidth-margin-30), with 5mm padding
        const textMaxWidth = contentWidth - 45; // Leave space for number (10mm) and badge (35mm)
        const recHeight = addWrappedText(rec.title, margin + 10, yPos + 6, textMaxWidth, 5);
        
        // Calculate box height with padding
        const boxHeight = Math.max(recHeight + 6, 12);
        
        // Draw box around recommendation
        doc.rect(margin, yPos, contentWidth, boxHeight);
        
        yPos += boxHeight + 5;
      });
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Recommendations have not been generated for this audit yet.', margin + 5, yPos + 5);
      doc.text('Please use the "Generate AI Recommendations" feature to receive', margin + 5, yPos + 12);
      doc.text('personalized security improvement suggestions.', margin + 5, yPos + 19);
      yPos += 30;
    }

    console.log('Recommendations complete');

    // ==================== CONCLUSION ====================
    addNewPage();
    console.log('Rendering conclusion...');
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Conclusion', margin, yPos);
    yPos += 10;

    doc.setDrawColor(25, 118, 210);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Conclusion box
    doc.setFillColor(255, 243, 224); // Light orange
    doc.rect(margin, yPos, contentWidth, 70, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Summary of Findings', margin + 5, yPos + 8);
    
    doc.setFont('helvetica', 'normal');
    const conclusionText = `The trade secret protection audit for ${audit.companyName} has been completed with an overall score of ${audit.percentageScore}% and a ${audit.riskLevel} risk classification.`;
    addWrappedText(conclusionText, margin + 5, yPos + 15, contentWidth - 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Next Steps', margin + 5, yPos + 35);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('1. Review and prioritize the recommendations based on organizational resources', margin + 5, yPos + 42);
    doc.text('2. Develop an implementation timeline for high-priority items', margin + 5, yPos + 48);
    doc.text('3. Assign responsibility for each recommendation to appropriate stakeholders', margin + 5, yPos + 54);
    doc.text('4. Schedule follow-up audits to measure improvement', margin + 5, yPos + 60);
    
    yPos += 75;

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Trade Secret Audit Toolkit', pageWidth / 2, yPos + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`This report is confidential and intended solely for the use of ${audit.companyName}`, pageWidth / 2, yPos + 16, { align: 'center' });
    doc.text(`Generated on ${currentDate}`, pageWidth / 2, yPos + 21, { align: 'center' });

    console.log('Conclusion complete');

    // Save the PDF
    const filename = `Trade_Secret_Audit_Report_${audit.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log('Saving PDF:', filename);
    doc.save(filename);
    
    console.log('✅ PDF generated successfully!');
    return { success: true };

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};
