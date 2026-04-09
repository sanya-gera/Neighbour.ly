import { ReactNode } from 'react';
import { Header } from './Header';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  role: 'citizen' | 'authority';
}

interface LayoutProps {
  children: ReactNode;
  user?: User | null;
  onRoleSwitch?: (role: 'citizen' | 'authority') => void;
  onSignOut?: () => void;
}

export function Layout({ children, user, onRoleSwitch, onSignOut }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user} 
        onRoleSwitch={onRoleSwitch} 
        onSignOut={onSignOut} 
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
