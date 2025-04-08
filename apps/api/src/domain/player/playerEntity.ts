import type { Gender } from '@hoop/shared';

export interface PlayerEntity {
  readonly id: string;
  readonly clubId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: Date;
  readonly gender: Gender;
  readonly address: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly photoUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function getPlayerFullName(player: PlayerEntity): string {
  return `${player.lastName} ${player.firstName}`;
}
