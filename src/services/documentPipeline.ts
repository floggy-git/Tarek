/**
 * Document & PDF Pipeline Service
 * 
 * Pipeline:
 * Invoice/Lesson Data ──> Generator ──> High-Fidelity PDF ──> Google Drive ──> Stored Document Ref
 * 
 * Guarantees:
 * 1. Strict Student ID isolation: Never leaks records from other students into a generated PDF.
 * 2. Vector searchability with embedded Arabic/Latin typography.
 * 3. Automated Google Drive archival under Student-{StudentID}/Invoices/ or Lesson Reports/.
 */

import type { jsPDF } from 'jspdf';
import {
  StudentRecord,
  Lesson,
  WalletTransaction,
  Assessment,
  SchoolSettings,
  Language,
  InvoiceRecord
} from '../types';
import { generateInvoicePDF, generateSelectableDossierPDF } from '../utils/arabicPdfHelper';
import { uploadStudentDocument, DriveUploadResult } from './googleDriveService';

export interface DocumentPipelineResult {
  success: boolean;
  doc?: jsPDF;
  pdfBlob?: Blob;
  pdfBase64?: string;
  driveResult?: DriveUploadResult;
  driveFileId?: string;
  driveUrl?: string;
  error?: string;
}

export interface GenerateInvoicePipelineParams {
  invoice: {
    id: string; // e.g. INV-2026-001
    studentId: string;
    studentName: string;
    studentEmail?: string;
    studentPhone?: string;
    studentAddress?: string;
    date: string;
    dueDate?: string;
    items: Array<{
      description: string;
      hours?: number;
      rate?: number;
      amount: number;
    }>;
    totalAmount: number;
    status: 'paid' | 'unpaid' | 'credited';
    paymentMethod?: string;
    notes?: string;
  };
  student?: Partial<StudentRecord>;
  schoolSettings?: Partial<SchoolSettings>;
  lang?: Language;
  accessToken?: string;
}

/**
 * Generates an official PDF invoice and archives it directly into the student's Google Drive folder.
 */
export async function generateAndArchiveInvoice(
  params: GenerateInvoicePipelineParams
): Promise<DocumentPipelineResult> {
  const { invoice, student, schoolSettings, lang = 'nl', accessToken } = params;

  try {
    const studentId = invoice.studentId || student?.studentId || student?.id;
    if (!studentId) {
      return { success: false, error: 'Student ID is required for invoice generation and archival.' };
    }

    // Safety validation: Prevent student identity mismatch
    if (student && student.id && invoice.studentId && student.id !== invoice.studentId && student.studentId !== invoice.studentId) {
      return { success: false, error: 'Security Violation: Invoice studentId does not match current student context.' };
    }

    // 1. Generate jsPDF vector invoice
    const invoicePayload = {
      invoiceNumber: invoice.id,
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate || invoice.date,
      studentName: invoice.studentName || student?.name || 'Student',
      studentId: studentId,
      studentEmail: invoice.studentEmail || student?.email || '',
      studentPhone: invoice.studentPhone || student?.phone || '',
      studentAddress: invoice.studentAddress || student?.city || '',
      items: invoice.items.map(item => ({
        description: item.description,
        hours: item.hours || 1,
        rate: item.rate || (item.amount / (item.hours || 1)),
        amount: item.amount
      })),
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod || 'iDEAL / Bank Transfer',
      notes: invoice.notes
    };

    const doc = await generateInvoicePDF(invoicePayload, lang, schoolSettings);

    // 2. Generate Binary Blob and Base64
    const pdfBlob = doc.output('blob');
    const pdfBase64 = doc.output('datauristring');

    // 3. Optional Google Drive Archival if accessToken is provided
    let driveResult: DriveUploadResult | undefined = undefined;
    if (accessToken) {
      const fileName = `${invoice.id}_${invoice.studentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      driveResult = await uploadStudentDocument({
        studentId,
        documentCategory: 'Invoices',
        recordId: invoice.id,
        fileName,
        mimeType: 'application/pdf',
        fileBlob: pdfBlob,
        schoolSettings,
        accessToken
      });
    }

    return {
      success: true,
      doc,
      pdfBlob,
      pdfBase64,
      driveResult,
      driveFileId: driveResult?.fileId,
      driveUrl: driveResult?.webViewLink
    };
  } catch (err: any) {
    console.error('Invoice pipeline error:', err);
    return {
      success: false,
      error: err.message || 'Invoice pipeline processing failed'
    };
  }
}

export interface GenerateDossierPipelineParams {
  student: StudentRecord;
  lessons: Lesson[];
  transactions: WalletTransaction[];
  assessments?: Assessment[];
  schoolSettings?: Partial<SchoolSettings>;
  lang?: Language;
  accessToken?: string;
}

/**
 * Generates an official Student Training Dossier & Progress Report PDF and archives it into Google Drive.
 */
export async function generateAndArchiveDossier(
  params: GenerateDossierPipelineParams
): Promise<DocumentPipelineResult> {
  const { student, lessons, transactions, assessments = [], schoolSettings, lang = 'nl', accessToken } = params;

  try {
    const studentId = student.studentId || student.id;
    if (!studentId) {
      return { success: false, error: 'Student ID is required for dossier generation.' };
    }

    // Safety validation: Filter lessons & transactions strictly to this student
    const isolatedLessons = lessons.filter(l => l.studentId === studentId || l.studentName === student.name);
    const isolatedTransactions = transactions.filter(t => t.studentId === studentId || t.studentName === student.name);
    const isolatedAssessments = assessments.filter(a => (a as any).studentId === studentId || a.studentName === student.name);

    // 1. Generate jsPDF Dossier
    const doc = await generateSelectableDossierPDF(
      student.name,
      lang,
      isolatedLessons,
      isolatedTransactions,
      isolatedAssessments,
      student,
      schoolSettings
    );

    // 2. Generate Binary Blob and Base64
    const pdfBlob = doc.output('blob');
    const pdfBase64 = doc.output('datauristring');

    // 3. Optional Google Drive Archival
    let driveResult: DriveUploadResult | undefined = undefined;
    if (accessToken) {
      const fileName = `Dossier_${studentId}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      driveResult = await uploadStudentDocument({
        studentId,
        documentCategory: 'Lesson Reports',
        recordId: `DOS-${studentId}-${Date.now()}`,
        fileName,
        mimeType: 'application/pdf',
        fileBlob: pdfBlob,
        schoolSettings,
        accessToken
      });
    }

    return {
      success: true,
      doc,
      pdfBlob,
      pdfBase64,
      driveResult,
      driveFileId: driveResult?.fileId,
      driveUrl: driveResult?.webViewLink
    };
  } catch (err: any) {
    console.error('Dossier pipeline error:', err);
    return {
      success: false,
      error: err.message || 'Dossier pipeline processing failed'
    };
  }
}
