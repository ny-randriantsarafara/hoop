import { ImportFlow } from '@/features/ocr/ui/import-flow';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Document Import</h1>
      <ImportFlow />
    </div>
  );
}
