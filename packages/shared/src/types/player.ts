import type { Gender } from '../constants/enums';

export interface Player {
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
