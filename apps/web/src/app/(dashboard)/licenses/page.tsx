import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LicenseTable } from '@/features/licenses/ui/LicenseTable';
import { Button } from '@/shared/ui/button';

export default function LicensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Licenses</h1>
          <p className="text-muted-foreground">View all player licenses</p>
        </div>
        <Link href="/licenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New License
          </Button>
        </Link>
      </div>
      <LicenseTable />
    </div>
  );
}
