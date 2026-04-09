import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Menu, Star, Trophy, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  role: 'citizen' | 'authority';
}

interface HeaderProps {
  user?: User | null;
  onRoleSwitch?: (role: 'citizen' | 'authority') => void;
  onSignOut?: () => void;
}

export function Header({ user, onRoleSwitch, onSignOut }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
  };

  const navItems = user ? [
    { href: '/', label: 'Dashboard', icon: null },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ] : [];

  const handleRoleSwitch = () => {
    if (user && onRoleSwitch) {
      const newRole = user.role === 'citizen' ? 'authority' : 'citizen';
      onRoleSwitch(newRole);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Logo and App Name */}
        <Link to="/" className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/logo.jpg" alt="Crowdsourced Problem Solver" />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              CPS
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-lg hidden sm:inline-block">
            Crowdsourced Problem Solver
          </span>
          <span className="font-bold text-lg sm:hidden">CPS</span>
        </Link>

        {/* Center: Welcome message (desktop only) */}
        {user && (
          <div className="hidden lg:flex items-center">
            <span className="text-muted-foreground">
              Welcome, <span className="text-foreground font-medium">{user.name}</span>
            </span>
          </div>
        )}

        {/* Right: User controls or Login */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Points Badge */}
              <Badge variant="secondary" className="hidden sm:flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>{user.points}</span>
              </Badge>

              {/* Role Switch Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRoleSwitch}
                className="hidden md:flex capitalize"
                aria-label={`Switch to ${user.role === 'citizen' ? 'authority' : 'citizen'} view`}
              >
                {user.role === 'citizen' ? 'Switch to Authority' : 'Switch to Citizen'}
              </Button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={isActive(item.href) ? "default" : "ghost"}
                      size="sm"
                    >
                      <Link to={item.href} className="flex items-center space-x-1">
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </nav>

              {/* User Avatar Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem className="md:hidden" onClick={handleRoleSwitch}>
                    Switch to {user.role === 'citizen' ? 'Authority' : 'Citizen'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    {/* Points on mobile */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="text-sm font-medium">Points</span>
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{user.points}</span>
                      </Badge>
                    </div>

                    {/* Role Switch on mobile */}
                    <Button
                      variant="outline"
                      onClick={handleRoleSwitch}
                      className="justify-start"
                    >
                      Switch to {user.role === 'citizen' ? 'Authority' : 'Citizen'}
                    </Button>

                    {/* Navigation items */}
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.href}
                          asChild
                          variant={isActive(item.href) ? "default" : "ghost"}
                          className="justify-start"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to={item.href} className="flex items-center space-x-2">
                            {Icon && <Icon className="h-4 w-4" />}
                            <span>{item.label}</span>
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
