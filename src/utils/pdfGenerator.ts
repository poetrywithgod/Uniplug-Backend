import PDFDocument from 'pdfkit';
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
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      try {
        // Upload PDF Buffer directly to Cloudinary
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

        resolve({
          pdfBuffer,
          fileUrl: uploadResult.secure_url,
        });
      } catch (err) {
        // Fallback: Return buffer even if Cloudinary fails
        resolve({
          pdfBuffer,
          fileUrl: '',
        });
      }
    });

    doc.on('error', (err: Error) => reject(err));


    // Header
    doc
      .fillColor('#1E3A8A')
      .fontSize(22)
      .text(data.schoolName.toUpperCase(), { align: 'center' })
      .moveDown(0.2);

    doc
      .fillColor('#4B5563')
      .fontSize(13)
      .text('OFFICE OF THE REGISTRAR & ADMISSIONS BOARD', { align: 'center' })
      .text(`ACADEMIC SESSION: ${data.session}`, { align: 'center' })
      .moveDown(1);

    doc
      .strokeColor('#1E3A8A')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1.5);

    // Title
    doc
      .fillColor('#111827')
      .fontSize(16)
      .text('PROVISIONAL LETTER OF ADMISSION OFFER', { align: 'center', underline: true })
      .moveDown(1.5);

    // Date & Ref
    const formattedDate = new Date(data.dateIssued).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(`Date: ${formattedDate}`, { align: 'right' })
      .text(`Application Ref: ${data.applicationNumber}`, { align: 'right' })
      .text(`Matriculation No: ${data.matricNumber}`, { align: 'right' })
      .moveDown(1.5);

    // Salutation
    doc
      .fontSize(11)
      .fillColor('#111827')
      .text(`Dear ${data.applicantName},`, { underline: false })
      .moveDown(1);

    // Body Text
    doc
      .fontSize(11)
      .fillColor('#1F2937')
      .text(
        `We are pleased to inform you that the Admissions Board of ${data.schoolName} has approved your provisional admission for the ${data.session} academic session.`,
        { align: 'justify' }
      )
      .moveDown(1);

    // Admission Details Table / Box
    doc
      .rect(50, doc.y, 495, data.isAlternativeOffer ? 110 : 90)
      .fillAndStroke('#F3F4F6', '#D1D5DB');

    let boxY = doc.y - (data.isAlternativeOffer ? 100 : 80);

    doc
      .fillColor('#111827')
      .fontSize(10)
      .text(`Programme / Course Offered:  ${data.offeredCourse}`, 65, boxY)
      .text(`Faculty / School:                   ${data.offeredFaculty}`, 65, boxY + 18)
      .text(`Matriculation Number:            ${data.matricNumber}`, 65, boxY + 36)
      .text(`Admission Status:                 PROVISIONAL & VERIFIED`, 65, boxY + 54);

    if (data.isAlternativeOffer) {
      doc
        .fillColor('#B45309')
        .text(`Original Choice:                    ${data.originalCourse} (Realigned)`, 65, boxY + 72);
    }

    doc.moveDown(4);

    if (data.isAlternativeOffer) {
      doc
        .fillColor('#B45309')
        .fontSize(10)
        .text(
          `Note: You were offered ${data.offeredCourse} as a realigned alternative choice based on your entry score and department cut-off considerations.`,
          { align: 'justify' }
        )
        .moveDown(1);
    }

    if (data.remarks) {
      doc
        .fillColor('#374151')
        .fontSize(10)
        .text(`Officer Remarks: ${data.remarks}`, { align: 'justify' })
        .moveDown(1);
    }

    doc
      .fillColor('#1F2937')
      .fontSize(10)
      .text(
        'Please keep this document safe for your physical screening and clearance at the Admissions Office.',
        { align: 'justify' }
      )
      .moveDown(2);

    // Signatures
    doc
      .fillColor('#111827')
      .fontSize(10)
      .text('Yours faithfully,', 50)
      .moveDown(2)
      .text(`${data.issuedByOfficer}`, 50)
      .text('Admissions Officer / Registrar', 50)
      .text(`${data.schoolName}`, 50);

    doc.end();
  });
}
