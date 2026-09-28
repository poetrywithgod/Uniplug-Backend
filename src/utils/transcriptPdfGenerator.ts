import crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import cloudinary from '../configs/cloudinaryConfig';

export interface TranscriptCourseItem {
  courseCode: string;
  courseName: string;
  creditUnits: number;
  letterGrade: string;
  gradePoint: number;
}

export interface TranscriptSemesterGroup {
  session: string;
  semester: string;
  gpa: number;
  courses: TranscriptCourseItem[];
}

export interface OfficialTranscriptData {
  studentName: string;
  matricNo: string;
  schoolName: string;
  programmeName: string;
  departmentName: string;
  cgpa: number;
  degreeClass: string;
  totalEarnedUnits: number;
  verificationCode: string;
  verificationHash: string;
  dateIssued: Date;
  semesters: TranscriptSemesterGroup[];
}

export function computeTranscriptHash(data: {
  matricNo: string;
  cgpa: number;
  totalEarnedUnits: number;
  coursesSnapshot: string;
}): string {
  const content = `${data.matricNo}|${data.cgpa}|${data.totalEarnedUnits}|${data.coursesSnapshot}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function getDegreeClassification(cgpa: number): string {
  if (cgpa >= 4.5) return 'First Class Honours';
  if (cgpa >= 3.5) return 'Second Class Honours (Upper Division)';
  if (cgpa >= 2.4) return 'Second Class Honours (Lower Division)';
  if (cgpa >= 1.5) return 'Third Class Honours';
  if (cgpa >= 1.0) return 'Pass';
  return 'Fail';
}

export async function generateOfficialTranscriptPDF(
  data: OfficialTranscriptData,
): Promise<{ pdfBuffer: Buffer; fileUrl: string }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  let y = height - margin;

  const navy = rgb(0.08, 0.18, 0.38);
  const darkGray = rgb(0.25, 0.28, 0.33);
  const lightGray = rgb(0.92, 0.94, 0.96);
  const black = rgb(0.1, 0.1, 0.1);
  const borderGray = rgb(0.8, 0.82, 0.85);

  // --- Header ---
  const institutionText = data.schoolName.toUpperCase();
  const instWidth = helveticaBold.widthOfTextAtSize(institutionText, 16);
  page.drawText(institutionText, {
    x: (width - instWidth) / 2,
    y,
    size: 16,
    font: helveticaBold,
    color: navy,
  });
  y -= 18;

  const registryText = 'OFFICE OF THE REGISTRAR (EXAMINATIONS & ACADEMIC RECORDS)';
  const regWidth = helvetica.widthOfTextAtSize(registryText, 9);
  page.drawText(registryText, {
    x: (width - regWidth) / 2,
    y,
    size: 9,
    font: helvetica,
    color: darkGray,
  });
  y -= 16;

  const docTitle = 'OFFICIAL ACADEMIC TRANSCRIPT';
  const titleWidth = helveticaBold.widthOfTextAtSize(docTitle, 12);
  page.drawText(docTitle, {
    x: (width - titleWidth) / 2,
    y,
    size: 12,
    font: helveticaBold,
    color: navy,
  });
  y -= 20;

  // Divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: navy,
  });
  y -= 18;

  // --- Student Info Block ---
  const leftColX = margin + 10;
  const rightColX = width / 2 + 10;

  page.drawText(`Student Name: ${data.studentName}`, {
    x: leftColX,
    y,
    size: 9,
    font: helveticaBold,
    color: black,
  });
  page.drawText(`Matriculation No: ${data.matricNo}`, {
    x: rightColX,
    y,
    size: 9,
    font: helveticaBold,
    color: black,
  });
  y -= 14;

  page.drawText(`Programme: ${data.programmeName}`, {
    x: leftColX,
    y,
    size: 9,
    font: helvetica,
    color: darkGray,
  });
  page.drawText(`Department: ${data.departmentName}`, {
    x: rightColX,
    y,
    size: 9,
    font: helvetica,
    color: darkGray,
  });
  y -= 14;

  page.drawText(`Degree Class: ${data.degreeClass}`, {
    x: leftColX,
    y,
    size: 9,
    font: helveticaBold,
    color: navy,
  });
  page.drawText(`Final Cumulative CGPA: ${data.cgpa.toFixed(2)}`, {
    x: rightColX,
    y,
    size: 9,
    font: helveticaBold,
    color: navy,
  });
  y -= 20;

  // --- Course Results Table Header ---
  page.drawRectangle({
    x: margin,
    y: y - 4,
    width: width - margin * 2,
    height: 18,
    color: lightGray,
    borderColor: borderGray,
    borderWidth: 0.5,
  });

  page.drawText('Code', { x: margin + 8, y, size: 8, font: helveticaBold, color: navy });
  page.drawText('Course Title', { x: margin + 70, y, size: 8, font: helveticaBold, color: navy });
  page.drawText('Units', { x: width - margin - 150, y, size: 8, font: helveticaBold, color: navy });
  page.drawText('Grade', { x: width - margin - 100, y, size: 8, font: helveticaBold, color: navy });
  page.drawText('Points', { x: width - margin - 50, y, size: 8, font: helveticaBold, color: navy });
  y -= 18;

  // --- Course Rows ---
  for (const sem of data.semesters) {
    if (y < 120) break; // Keep space for footer

    // Semester Header
    page.drawText(`${sem.session} — ${sem.semester.replace('_', ' ')} (GPA: ${sem.gpa.toFixed(2)})`, {
      x: margin + 8,
      y,
      size: 8,
      font: helveticaBold,
      color: navy,
    });
    y -= 14;

    for (const course of sem.courses) {
      if (y < 120) break;

      const title = course.courseName.length > 38 ? `${course.courseName.substring(0, 35)}...` : course.courseName;

      page.drawText(course.courseCode, { x: margin + 8, y, size: 8, font: helvetica, color: black });
      page.drawText(title, { x: margin + 70, y, size: 8, font: helvetica, color: black });
      page.drawText(String(course.creditUnits), { x: width - margin - 140, y, size: 8, font: helvetica, color: black });
      page.drawText(course.letterGrade, { x: width - margin - 90, y, size: 8, font: helveticaBold, color: black });
      page.drawText(String(course.gradePoint), { x: width - margin - 40, y, size: 8, font: helvetica, color: black });
      y -= 12;
    }
    y -= 4;
  }

  // --- Footer / Integrity Verification ---
  const footerY = 90;

  page.drawLine({
    start: { x: margin, y: footerY + 20 },
    end: { x: width - margin, y: footerY + 20 },
    thickness: 1,
    color: borderGray,
  });

  page.drawText(`Official Verification Code: ${data.verificationCode}`, {
    x: margin,
    y: footerY + 8,
    size: 8,
    font: helveticaBold,
    color: navy,
  });

  page.drawText(`Date of Issuance: ${data.dateIssued.toISOString().split('T')[0]}`, {
    x: width - margin - 170,
    y: footerY + 8,
    size: 8,
    font: helvetica,
    color: darkGray,
  });

  const hashSnippet = data.verificationHash ? data.verificationHash.substring(0, 32) : 'N/A';
  page.drawText(`Tamper-Proof Integrity Hash (SHA-256): ${hashSnippet}...`, {
    x: margin,
    y: footerY - 4,
    size: 7,
    font: helvetica,
    color: darkGray,
  });

  page.drawText('Online Verification: https://api.uniplug.net/api/v1/meta/transcripts/verify/' + data.verificationCode, {
    x: margin,
    y: footerY - 16,
    size: 7,
    font: helvetica,
    color: navy,
  });

  page.drawText('OFFICIAL SEAL & SIGNATURE REQUIRED FOR VALIDATION', {
    x: width - margin - 220,
    y: footerY - 16,
    size: 7,
    font: helveticaBold,
    color: darkGray,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  let fileUrl = '';
  try {
    const uploadResult = await new Promise<any>((res, rej) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'academic_records/transcripts',
          resource_type: 'raw',
          public_id: `transcript_${data.verificationCode}_${Date.now()}.pdf`,
        },
        (error, result) => {
          if (error) return rej(error);
          res(result);
        },
      );
      stream.end(pdfBuffer);
    });
    fileUrl = uploadResult.secure_url;
  } catch {
    // If Cloudinary is unconfigured in development, buffer remains available
  }

  return { pdfBuffer, fileUrl };
}
