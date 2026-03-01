import type { OcrExtractionResponse, ValidateExtractionInput } from '@hoop/shared';
import { apiClient } from '@/shared/lib/apiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function extractDocument(
  token: string,
  file: File,
): Promise<OcrExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/ocr/extract`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (response.status === 503) {
    throw new Error('OCR feature is not configured on the server');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Extraction failed (${response.status})`);
  }

  return response.json() as Promise<OcrExtractionResponse>;
}

export function saveValidatedData(
  token: string,
  extractionId: string,
  input: ValidateExtractionInput,
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/ocr/extractions/${extractionId}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
