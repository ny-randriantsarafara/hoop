import type { SpreadsheetPreview } from '@hoop/shared';
import { parseXlsxForPreview } from '../../infrastructure/template/xlsxPreviewParser';

export async function previewTemplate(
  fileBuffer: Buffer,
  filename: string,
): Promise<SpreadsheetPreview> {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext !== 'xlsx') {
    throw new Error('Only .xlsx files can be previewed');
  }

  return parseXlsxForPreview(fileBuffer);
}
