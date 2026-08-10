import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import cloudinary from '../configs/cloudinaryConfig';

export interface OfferLetterData {
  applicantName: string;
  applicantEmail: string;
  applicationNumber: string;
  matricNumber: string;
  schoolName: string;
  session: string;
  offeredCourse: string;
  offeredFaculty: string;
  originalCourse: string;
  isAlternativeOffer: boolean;
  remarks?: string | null;
  issuedByOfficer: string;
  dateIssued: Date;
}

export async function generateOfferLetterPDF(
  data: OfferLetterData
): Promise<{ pdfBuffer: Buffer; fileUrl: string }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const navy = rgb(0.12, 0.23, 0.54);
  const darkGray = rgb(0.29, 0.33, 0.39);
  const black = rgb(0.07, 0.09, 0.11);
  const bodyColor = rgb(0.12, 0.16, 0.22);
  const amber = rgb(0.71, 0.32, 0.04);

  // --- Header: School Name ---
  const schoolTitle = data.schoolName.toUpperCase();
  const schoolTitleWidth = helveticaBold.widthOfTextAtSize(schoolTitle, 20);
  page.drawText(schoolTitle, {
    x: (width - schoolTitleWidth) / 2,
    y,
    size: 20,
    font: helveticaBold,
    color: navy,
  });
  y -= 22;

  // --- Sub-header ---
  const subHeader1 = 'OFFICE OF THE REGISTRAR & ADMISSIONS BOARD';
  const sub1Width = helvetica.widthOfTextAtSize(subHeader1, 11);
  page.drawText(subHeader1, {
    x: (width - sub1Width) / 2,
    y,
    size: 11,
    font: helvetica,
    color: darkGray,
  });
  y -= 16;

  const subHeader2 = `ACADEMIC SESSION: ${data.session}`;
  const sub2Width = helvetica.widthOfTextAtSize(subHeader2, 11);
  page.drawText(subHeader2, {
    x: (width - sub2Width) / 2,
    y,
    size: 11,
    font: helvetica,
    color: darkGray,
  });
  y -= 20;

  // --- Divider Line ---
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: navy,
  });
  y -= 30;

  // --- Title ---
  const title = 'PROVISIONAL LETTER OF ADMISSION OFFER';
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 14);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 14,
    font: helveticaBold,
    color: black,
  });
  y -= 30;

  // --- Date & Ref (right-aligned) ---
  const formattedDate = new Date(data.dateIssued).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rightLines = [
    `Date: ${formattedDate}`,
    `Application Ref: ${data.applicationNumber}`,
    `Matriculation No: ${data.matricNumber}`,
  ];

  for (const line of rightLines) {
    const lineWidth = helvetica.widthOfTextAtSize(line, 9);
    page.drawText(line, {
      x: width - margin - lineWidth,
      y,
      size: 9,
      font: helvetica,
      color: darkGray,
    });
    y -= 14;
  }
  y -= 16;

  // --- Salutation ---
  page.drawText(`Dear ${data.applicantName},`, {
    x: margin,
    y,
    size: 11,
    font: helvetica,
    color: black,
  });
  y -= 24;

  // --- Body Paragraph ---
  const bodyText = `We are pleased to inform you that the Admissions Board of ${data.schoolName} has approved your provisional admission for the ${data.session} academic session.`;
  const bodyLines = wrapText(bodyText, helvetica, 11, width - 2 * margin);
  for (const line of bodyLines) {
    page.drawText(line, {
      x: margin,
      y,
      size: 11,
      font: helvetica,
      color: bodyColor,
    });
    y -= 16;
  }
  y -= 10;

  // --- Admission Details Box ---
  const boxHeight = data.isAlternativeOffer ? 100 : 82;
  page.drawRectangle({
    x: margin,
    y: y - boxHeight,
    width: width - 2 * margin,
    height: boxHeight,
    color: rgb(0.95, 0.96, 0.96),
    borderColor: rgb(0.82, 0.84, 0.86),
    borderWidth: 1,
  });

  const detailLines = [
    `Programme / Course Offered:   ${data.offeredCourse}`,
    `Faculty / School:                        ${data.offeredFaculty}`,
    `Matriculation Number:                ${data.matricNumber}`,
    `Admission Status:                      PROVISIONAL & VERIFIED`,
  ];

  if (data.isAlternativeOffer) {
    detailLines.push(`Original Choice:                        ${data.originalCourse} (Realigned)`);
  }

  let detailY = y - 16;
  for (let i = 0; i < detailLines.length; i++) {
    const isRealigned = i === 4;
    page.drawText(detailLines[i], {
      x: margin + 15,
      y: detailY,
      size: 9,
      font: helvetica,
      color: isRealigned ? amber : black,
    });
    detailY -= 16;
  }
  y = y - boxHeight - 20;

  // --- Alternative Offer Note ---
  if (data.isAlternativeOffer) {
    const altNote = `Note: You were offered ${data.offeredCourse} as a realigned alternative choice based on your entry score and department cut-off considerations.`;
    const altLines = wrapText(altNote, helvetica, 9, width - 2 * margin);
    for (const line of altLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 9,
        font: helvetica,
        color: amber,
      });
      y -= 14;
    }
    y -= 6;
  }

  // --- Remarks ---
  if (data.remarks) {
    const remarkText = `Officer Remarks: ${data.remarks}`;
    const remarkLines = wrapText(remarkText, helvetica, 9, width - 2 * margin);
    for (const line of remarkLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 9,
        font: helvetica,
        color: darkGray,
      });
      y -= 14;
    }
    y -= 6;
  }

  // --- Instruction ---
  const instruction =
    'Please keep this document safe for your physical screening and clearance at the Admissions Office.';
  const instrLines = wrapText(instruction, helvetica, 9, width - 2 * margin);
  for (const line of instrLines) {
    page.drawText(line, {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: bodyColor,
    });
    y -= 14;
  }
  y -= 30;

  // --- Signature ---
  page.drawText('Yours faithfully,', { x: margin, y, size: 10, font: helvetica, color: black });
  y -= 30;
  page.drawText(data.issuedByOfficer, { x: margin, y, size: 10, font: helveticaBold, color: black });
  y -= 14;
  page.drawText('Admissions Officer / Registrar', { x: margin, y, size: 9, font: helvetica, color: darkGray });
  y -= 14;
  page.drawText(data.schoolName, { x: margin, y, size: 9, font: helvetica, color: darkGray });

  // --- Serialize to buffer ---
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // --- Upload to Cloudinary ---
  let fileUrl = '';
  try {
    const uploadResult = await new Promise<any>((res, rej) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'applications/offer_letters',
          resource_type: 'raw',
          public_id: `offer_letter_${data.applicationNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`,
        },
        (error, result) => {
          if (error) return rej(error);
          res(result);
        }
      );
      stream.end(pdfBuffer);
    });
    fileUrl = uploadResult.secure_url;
  } catch {
    // Cloudinary upload failed — buffer is still usable for email attachment
  }

  return { pdfBuffer, fileUrl };
}

/**
 * Simple word-wrap utility for pdf-lib (no built-in text wrapping).
 */
function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}