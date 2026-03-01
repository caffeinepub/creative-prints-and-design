import React, { useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useVerifyAdminStatus, useRegisterUserProfile } from '../hooks/useQueries';
import AuthDialog from './AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const { data: isAdmin } = useVerifyAdminStatus();

  // Register user profile in backend whenever authenticated
  const registerMutation = useRegisterUserProfile();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !syncedRef.current) {
      syncedRef.current = true;
      const isAdminEmail = user.email.toLowerCase() === 'lanepeevy@gmail.com';
      registerMutation.mutate(
        { email: user.email, name: user.name, isAdmin: isAdminEmail },
        {
          onError: () => {
            // Registration may fail if already registered — that's fine
            syncedRef.current = false;
          },
        }
      );
    }
    if (!isAuthenticated) {
      syncedRef.current = false;
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate({ to: '/' });
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/store', label: 'Store' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/custom-order', label: 'Custom Order' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors">
              <img
                src="/assets/generated/creative-prints-logo.dim_256x256.png"
                alt="Creative Prints and Design logo"
                className="h-10 w-10 object-contain flex-shrink-0"
              />
              <span className="text-sm font-semibold leading-tight">
                Creative Prints<br />
                <span className="text-xs font-normal text-muted-foreground">and Design</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: 'text-foreground font-medium' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate({ to: '/admin' })} className="gap-2 cursor-pointer">
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" onClick={() => setAuthDialogOpen(true)}>
                  Login
                </Button>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(v => !v)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-border py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  activeProps={{ className: 'text-foreground font-medium bg-muted' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                src="/assets/generated/creative-prints-logo.dim_256x256.png"
                alt="Creative Prints and Design logo"
                className="h-6 w-6 object-contain"
              />
              <span className="font-medium text-foreground">Creative Prints and Design</span>
            </div>
            <p>© {new Date().getFullYear()} Creative Prints and Design. All rights reserved.</p>
            <p>
              Built with{' '}
              <span className="text-destructive">♥</span>{' '}
              using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
