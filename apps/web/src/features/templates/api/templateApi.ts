import { apiClient } from '@/shared/lib/apiClient';
import type { Template, SpreadsheetPreview, CellMapping } from '@hoop/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export function fetchTemplates(token: string): Promise<Template[]> {
  return apiClient<Template[]>('/templates', { token });
}

export function deleteTemplate(token: string, id: string): Promise<void> {
  return apiClient<undefined>(`/templates/${id}`, { token, method: 'DELETE' });
}

export async function previewTemplate(
  token: string,
  file: File,
): Promise<SpreadsheetPreview> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/templates/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Preview failed' }));
    throw new Error(error.error ?? 'Preview failed');
  }
  return response.json() as Promise<SpreadsheetPreview>;
}

export async function uploadTemplate(
  token: string,
  file: File,
  name: string,
  description: string,
  cellMappings?: ReadonlyArray<CellMapping>,
): Promise<Template> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  if (description) formData.append('description', description);
  if (cellMappings && cellMappings.length > 0) {
    formData.append('cellMappings', JSON.stringify(cellMappings));
  }

  const response = await fetch(`${API_URL}/templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) throw new Error('Upload failed');
  return response.json() as Promise<Template>;
}

export function generateTemplate(
  token: string,
  data: { name: string; description?: string; columns: string[] },
): Promise<Template> {
  return apiClient<Template>('/templates/generate', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function downloadTemplate(token: string, id: string, filename: string): Promise<void> {
  const response = await fetch(`${API_URL}/templates/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
