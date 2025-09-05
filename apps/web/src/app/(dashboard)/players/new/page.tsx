import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { PlayerForm } from '@/features/players/ui/PlayerForm';

export default function NewPlayerPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Players', href: '/players' },
          { label: 'New Player' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold">Add Player</h1>
        <p className="text-muted-foreground">Register a new player</p>
      </div>
      <PlayerForm />
    </div>
  );
}
