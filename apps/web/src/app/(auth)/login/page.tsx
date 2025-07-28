import { LoginForm } from '@/features/auth/ui/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            H
          </div>
          <h1 className="mt-4 text-2xl font-bold">HoopAdmin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage licenses
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
