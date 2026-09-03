/**
 * Google Drive Integration Service
 * Manages organized cloud storage for:
 * - Student Invoices (PDFs)
 * - Student Lesson Reports / Dossiers (PDFs)
 * - Student Training Documents
 * 
 * Strict Folder Hierarchy:
 * [School Name]/
 *   └── Students/
 *         └── Student-{StudentID}/
 *               ├── Invoices/
 *               ├── Lesson Reports/
 *               └── Documents/
 */

import { SchoolSettings, getSchoolName } from '../types';
import { getSheetsConfig } from '../utils/googleSheets';

export type DocumentCategory = 'Invoices' | 'Lesson Reports' | 'Documents';

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  folderId?: string;
  error?: string;
}

// In-memory cache for folder IDs to prevent redundant API queries and duplicate folders
const folderCache = new Map<string, string>();

/**
 * Finds an existing folder by name and parentId, or creates a new one.
 */
async function getOrCreateFolder(
  folderName: string,
  parentId?: string,
  accessToken?: string
): Promise<string> {
  const cacheKey = `${parentId || 'root'}:${folderName}`;
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  const token = accessToken || getSheetsConfig().accessToken;
  if (!token) {
    throw new Error('Google OAuth Access Token is required for Drive operations.');
  }

  // 1. Search for existing folder
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const folderId = searchData.files[0].id;
      folderCache.set(cacheKey, folderId);
      return folderId;
    }
  }

  // 2. Create folder if not found
  const createPayload: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) {
    createPayload.parents = [parentId];
  }

  const createUrl = 'https://www.googleapis.com/drive/v3/files?fields=id,name';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Drive folder "${folderName}": ${errText}`);
  }

  const createData = await createRes.json();
  folderCache.set(cacheKey, createData.id);
  return createData.id;
}

/**
 * Ensures the full folder hierarchy exists for a given student:
 * [School]/Students/Student-{studentId}/{category}
 */
export async function ensureStudentFolderHierarchy(
  studentId: string,
  category: DocumentCategory,
  schoolSettings?: Partial<SchoolSettings>,
  accessToken?: string
): Promise<string> {
  const schoolName = getSchoolName(schoolSettings);
  const cleanStudentId = studentId.replace(/[^a-zA-Z0-9_-]/g, '') || 'ST-000001';

  // 1. Root School Folder
  const rootSchoolFolderId = await getOrCreateFolder(schoolName, undefined, accessToken);

  // 2. Students Directory
  const studentsFolderId = await getOrCreateFolder('Students', rootSchoolFolderId, accessToken);

  // 3. Specific Student Folder: Student-{studentId}
  const studentFolderId = await getOrCreateFolder(`Student-${cleanStudentId}`, studentsFolderId, accessToken);

  // 4. Category Folder (Invoices / Lesson Reports / Documents)
  const categoryFolderId = await getOrCreateFolder(category, studentFolderId, accessToken);

  return categoryFolderId;
}

export interface UploadStudentDocumentParams {
  studentId: string;
  documentCategory: DocumentCategory;
  recordId: string; // e.g. INV-2026-001 or LES-000001
  fileName: string;
  mimeType?: string;
  fileBlob: Blob | Uint8Array | string; // binary Blob, buffer, or base64 string
  schoolSettings?: Partial<SchoolSettings>;
  accessToken?: string;
}

/**
 * Uploads a student document to its isolated folder in Google Drive.
 * Associates metadata: studentId, category, recordId, creationDate.
 */
export async function uploadStudentDocument(
  params: UploadStudentDocumentParams
): Promise<DriveUploadResult> {
  const {
    studentId,
    documentCategory,
    recordId,
    fileName,
    mimeType = 'application/pdf',
    fileBlob,
    schoolSettings,
    accessToken
  } = params;

  const token = accessToken || getSheetsConfig().accessToken;
  if (!token) {
    return {
      success: false,
      error: 'Google OAuth Access Token is required to upload documents to Drive.'
    };
  }

  try {
    // 1. Locate/Create destination folder in Drive
    const targetFolderId = await ensureStudentFolderHierarchy(
      studentId,
      documentCategory,
      schoolSettings,
      token
    );

    // 2. Prepare file data
    let bodyData: Blob;
    if (typeof fileBlob === 'string') {
      // Base64 string
      const cleanBase64 = fileBlob.replace(/^data:[^;]+;base64,/, '');
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      bodyData = new Blob([byteArray], { type: mimeType });
    } else if (fileBlob instanceof Uint8Array) {
      bodyData = new Blob([fileBlob], { type: mimeType });
    } else {
      bodyData = fileBlob;
    }

    // 3. Multipart Upload Metadata + Binary content
    const metadata = {
      name: fileName,
      parents: [targetFolderId],
      properties: {
        studentId,
        documentCategory,
        recordId,
        uploadedAt: new Date().toISOString()
      },
      description: `Official ${documentCategory} for Student ${studentId} (Record ID: ${recordId})`
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const fileHeaderPart = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

    const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
    const fileHeaderBlob = new Blob([fileHeaderPart], { type: 'text/plain' });
    const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

    const multipartBlob = new Blob([metadataBlob, fileHeaderBlob, bodyData, closeBlob], {
      type: `multipart/related; boundary=${boundary}`
    });

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink';
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBlob
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return {
        success: false,
        error: `Drive Upload API Error ${uploadRes.status}: ${errText}`
      };
    }

    const data = await uploadRes.json();
    return {
      success: true,
      fileId: data.id,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
      folderId: targetFolderId
    };
  } catch (err: any) {
    console.error('Error uploading document to Google Drive:', err);
    return {
      success: false,
      error: err.message || 'Drive upload failed'
    };
  }
}
