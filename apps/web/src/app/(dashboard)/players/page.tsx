import { PlayerTable } from '@/features/players/ui/PlayerTable';

export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Players</h1>
        <p className="text-muted-foreground">Manage your club players</p>
      </div>
      <PlayerTable />
    </div>
  );
}
