import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { UserForm } from '@/features/users/ui/user-form';

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Users', href: '/users' }, { label: 'New User' }]} />
      <div>
        <h1 className="text-2xl font-bold">Add User</h1>
        <p className="text-muted-foreground">Create a new club user account</p>
      </div>
      <UserForm />
    </div>
  );
}
