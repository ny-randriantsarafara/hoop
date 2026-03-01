import { PlayerDetail } from '@/features/players/ui/player-detail';

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  return <PlayerDetail playerId={id} />;
}
