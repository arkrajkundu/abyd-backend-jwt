import PDFDocument from 'pdfkit';
import { existsSync, createWriteStream } from 'fs';

function checkCondition(bitstring, index) {
  return bitstring[index] === '1';
}

function getComplianceImage(percentage) {
  const imagePath = `./percentage/${percentage}.png`;
  if (existsSync(imagePath)) {
    return imagePath;
  } else {
    return './percentage/default.png';
  }
}

// Function to generate the PDF
export async function generatePDF(userId, companyName, industry, subIndustry, email, guidelines, maxPenalty, compliancePercentage, bestPractices, certifications, legalDocs, outputFilePath) {
  return new Promise((resolve, reject) => {
    // Simulate PDF generation with a timeout
    
  const doc = new PDFDocument();
  const writeStream = createWriteStream(outputFilePath);
  doc.pipe(writeStream);

  // Step 1: Header
  const headerImagePath = './header.jpeg';
  doc.image(headerImagePath, 75, 10, { width: 75 });

  // Step 2: Divider
  doc.moveDown().strokeColor('#000').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  // Step 3: Title
  doc.moveDown(1)
    .fontSize(21)
    .font('Helvetica-Bold')
    .text('RISK ANALYSIS SNAPSHOT', { underline: true, align: 'center' });

  // Step 4: Fetch Company Info
  const companyDetails = {
    companyName,
    industry,
    subIndustry,
    userId,
    email,
  };

  doc.moveDown(2)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(`Company Name:`, { continued: true, underline: true })
    .font('Helvetica')
    .text(` ${companyDetails.companyName}`, { underline: false });

  doc.font('Helvetica-Bold')
    .text(`Industry:`, { continued: true, underline: true })
    .font('Helvetica')
    .text(` ${companyDetails.industry}`, { underline: false });

  doc.font('Helvetica-Bold')
    .text(`Sub-Industry:`, { continued: true, underline: true })
    .font('Helvetica')
    .text(` ${companyDetails.subIndustry}`, { underline: false });

  doc.font('Helvetica-Bold')
    .text(`User ID:`, { continued: true, underline: true })
    .font('Helvetica')
    .text(` ${companyDetails.userId}`, { underline: false });

  doc.font('Helvetica-Bold')
    .text(`Email:`, { continued: true, underline: true })
    .font('Helvetica')
    .text(` ${companyDetails.email}`, { underline: false });

  // Step 5: Compliance Image
  const complianceImagePath = getComplianceImage(compliancePercentage);
  const pageWidth = doc.page.width;
  const imageWidth = 200;
  const complianceImageX = (pageWidth - imageWidth) / 2;

  doc.image(complianceImagePath, complianceImageX, doc.y, { width: 200, height: 150 });

  // Step 6: Compliance Percentage with Additional Text
  doc.moveDown(11)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`Compliance Percentage: ${compliancePercentage}%`, { align: 'center' });

  // Additional text after compliance percentage
  doc.moveDown(1)
    .fontSize(11)
    .font('Helvetica-Oblique')
    .lineGap(6)
    .text("[This progress percentage reflects the steps you have completed, based on your answers, to achieve the optimal compliance level.]");

  // Step 7: Maximum Potential Penalty Section
  doc.moveDown(2)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('MAXIMUM POTENTIAL PENALTY:', { underline: true });


  doc.moveDown(0)
    .fontSize(12)
    .font('Helvetica')
    .text(`According to current laws and regulations governing the fintech industry, the maximum penalty for non-compliance of your company can reach `, { continued: true })
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(`INR ${maxPenalty} lakhs.`);


  // Text after maximum potential penalty
  doc.moveDown(1)
    .fontSize(11)
    .font('Helvetica-Oblique')
    .lineGap(6)
    .text("[This number represents the maximum penalty mentioned in Acts and regulations that you could be fined based on your answers.]");

  // Step 8: Guidelines Section with Additional Text
  doc.moveDown(2)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('GUIDELINES TO AVOID PENALTIES: KEY STEPS FOR ENSURING COMPLIANCE:', { underline: true });

  // Additional text after guidelines heading
  doc.moveDown(1)
    .fontSize(11)
    .font('Helvetica-Oblique')
    .lineGap(6)
    .text("[This section provides the steps you should take, based on your answers, to reach the optimal compliance level you should aim for and avoid the maximum penalty mentioned.]");

  // Step 9: Listing the Guidelines
  guidelines.forEach((string, index) => {
    doc.font('Helvetica').text(`\n- ${string}\n`);
  });

  // Step 10: Industry best practices section with Additional Text
  doc.moveDown(2)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('INDUSTRY BEST PRACTICES THAT YOU SHOULD FOLLOW:', { underline: true });
  
    // Additional text after guidelines heading
  doc.moveDown(1)
    .fontSize(11)
    .font('Helvetica-Oblique')
    .lineGap(6)
    .text("[This section provides the best practices, based on your answers, that authorities expect you to follow]");

  // Step 11: Listing the practices
  bestPractices.forEach((string, index) => {
    doc.font('Helvetica').text(`\n- ${string}`);
  });

  // Step 12: CERTIFICATIONS section with Additional Text
  doc.moveDown(2)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('CERTIFICATIONS THAT YOU SHOULD GET:', { underline: true });
  
    // Additional text after guidelines heading
  doc.moveDown(1)
    .fontSize(11)
    .font('Helvetica-Oblique')
    .lineGap(6)
    .text("[This section provides the best certifications, based on your answers, that will come in useful]");

  // Step 13: Listing the certifications
  certifications.forEach((string, index) => {
    doc.font('Helvetica').text(`\n- ${string}`);
  });

  // Step 14: legal documents section with Additional Text
  doc.moveDown(2)
  .fontSize(14)
  .font('Helvetica-Bold')
  .text('LEGAL DOCUMENTS THAT YOU SHOULD BUILD:', { underline: true });
  
  // Additional text after guidelines heading
  doc.moveDown(1)
    .fontSize(11)
    .font('Helvetica-Oblique')
    .lineGap(6)
    .text("[This section provides the legal documents, based on your answers, that law expect you to  have]");

  // Step 15: Listing the certifications
  legalDocs.forEach((string, index) => {
    doc.font('Helvetica').text(`\n- ${string}`);
  });


  // Step 16: Contact Info
  doc.moveDown(2).fontSize(12).text('For more details contact us - contact@abyd.in', { align: 'center' });

  // Step 17: Divider
  doc.moveDown().strokeColor('#000').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  // Step 18: Footer
  const footerImagePath = './footer.png';
  const footerImageWidth = 150;
  const footerImageX = pageWidth - footerImageWidth - 70;

  doc.moveDown(1).image(footerImagePath, footerImageX, doc.y, { width: footerImageWidth });

  // Step 19: Finalize the PDF
  doc.end();
  writeStream.on('finish', () => {
    console.log(`PDF generated successfully at ${outputFilePath}`);
  });
  setTimeout(() => {
    //console.log('PDF generated');
    resolve(); // Resolve the promise when done
  }, 2000); // Simulating delay
  });
}

// const bitstring = '110101'; // Example bitstring for guidelines conditions
// const userId = 'user123'; // Example userId to fetch company details
// const compliancePercentage = 85; // Placeholder compliance percentage