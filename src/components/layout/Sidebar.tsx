'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Trophy,
  TrendingUp,
  Plus,
  Users,
  Target,
  ChevronDown,
  ChevronRight,
  Image,
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavigationSection {
  name: string;
  items: NavigationItem[];
  collapsible?: boolean;
}

const navigationSections: NavigationSection[] = [
  {
    name: 'Main',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      },
      {
        name: 'My Progress',
        href: '/progress',
        icon: TrendingUp,
      },
    ],
  },
  {
    name: 'Challenges',
    collapsible: true,
    items: [
      {
        name: 'Active Challenges',
        href: '/challenges',
        icon: Trophy,
        badge: '3',
      },
      {
        name: 'Create Challenge',
        href: '/challenges/create',
        icon: Plus,
      },
      {
        name: 'Join Challenge',
        href: '/challenges/join',
        icon: Users,
      },
    ],
  },
  {
    name: 'Tracking',
    collapsible: true,
    items: [
      {
        name: 'Weight Logging',
        href: '/weight-logging',
        icon: Target,
      },
    ],
  },
  {
    name: 'Development',
    collapsible: true,
    items: [
      {
        name: 'Test Images',
        href: '/test-images',
        icon: Image,
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionName: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionName)) {
      newCollapsed.delete(sectionName);
    } else {
      newCollapsed.add(sectionName);
    }
    setCollapsedSections(newCollapsed);
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={cn('pb-12 w-64', className)}>
      <div className="space-y-4 py-4">
        {navigationSections.map((section) => {
          const isCollapsed = collapsedSections.has(section.name);
          
          return (
            <div key={section.name} className="px-3 py-2">
              {section.collapsible ? (
                <Button
                  variant="ghost"
                  className="w-full justify-between px-2 py-1 h-auto font-semibold text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  onClick={() => toggleSection(section.name)}
                >
                  <span>{section.name}</span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <h2 className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {section.name}
                </h2>
              )}
              
              {(!section.collapsible || !isCollapsed) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Button
                        key={item.href}
                        variant={active ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start px-2 py-2 h-auto font-normal',
                          active && 'bg-secondary font-medium'
                        )}
                        asChild
                      >
                        <Link href={item.href}>
                          <Icon className="mr-2 h-4 w-4" />
                          <span className="flex-1 text-left">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 