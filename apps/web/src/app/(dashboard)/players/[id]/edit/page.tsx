import { PlayerEditForm } from '@/features/players/ui/player-edit-form';

interface PlayerEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerEditPage({ params }: PlayerEditPageProps) {
  const { id } = await params;
  return <PlayerEditForm playerId={id} />;
}
