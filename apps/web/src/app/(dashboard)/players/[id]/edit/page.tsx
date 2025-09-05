import { PlayerEditForm } from '@/features/players/ui/PlayerEditForm';

interface PlayerEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerEditPage({ params }: PlayerEditPageProps) {
  const { id } = await params;
  return <PlayerEditForm playerId={id} />;
}
