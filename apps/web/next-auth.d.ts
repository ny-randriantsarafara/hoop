declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    clubId?: string | null;
    accessToken?: string;
  }
}
