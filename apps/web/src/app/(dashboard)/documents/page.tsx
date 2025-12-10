import { DocumentGenerator } from '@/features/documents/ui/DocumentGenerator';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Generate documents from templates</p>
      </div>
      <DocumentGenerator />
    </div>
  );
}
