import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import type { User } from '@/lib/types';

export function AppShell({ children, user, actions }: { children: React.ReactNode; user: User; actions?: React.ReactNode }) {
  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="mx-auto flex w-full max-w-[1600px] gap-0">
        <Sidebar role={user.role} />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopBar user={user} actions={actions} />
          <main className="flex-1 space-y-8 px-8 py-8" style={{ backgroundColor: 'var(--background)' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
