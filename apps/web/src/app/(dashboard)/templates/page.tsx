import Link from 'next/link';
import { TemplateList } from '@/features/templates/ui/TemplateList';
import { Button } from '@/shared/ui/button';

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">Manage your document templates</p>
        </div>
        <div className="flex gap-2">
          <Link href="/templates/upload">
            <Button variant="outline">Upload Template</Button>
          </Link>
          <Link href="/templates/builder">
            <Button>Create Template</Button>
          </Link>
        </div>
      </div>
      <TemplateList />
    </div>
  );
}
