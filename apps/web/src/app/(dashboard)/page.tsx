import { StatsCards } from '@/features/dashboard/ui/StatsCards';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your club</p>
        </div>
        <div className="flex gap-2">
          <Link href="/players/new">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Player
            </Button>
          </Link>
        </div>
      </div>

      <StatsCards />
    </div>
  );
}
