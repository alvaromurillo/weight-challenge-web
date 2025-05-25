'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  Home,
  Trophy,
  TrendingUp,
  Settings,
  LogOut,
  User,
  Plus,
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'My Challenges',
    href: '/challenges',
    icon: Trophy,
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: TrendingUp,
  },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getUserInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Weight Challenge
            </span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-primary" />
                <span>Weight Challenge</span>
              </SheetTitle>
            </SheetHeader>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                <div className="border-t pt-3">
                  <Link
                    href="/challenges/create"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Challenge</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop navigation */}
        <div className="mr-4 hidden md:flex">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Mobile logo */}
          <div className="flex md:hidden">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-bold">Weight Challenge</span>
            </Link>
          </div>

          {/* Create Challenge Button */}
          <div className="hidden md:flex">
            <Button asChild size="sm">
              <Link href="/challenges/create">
                <Plus className="h-4 w-4 mr-1" />
                Create Challenge
              </Link>
            </Button>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email ? getUserInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 