import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Menu, X, ShoppingCart, Shield, Printer, Home, Image, Package, ClipboardList, LogIn, LogOut, User,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useCart } from '../hooks/useCart';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/store', label: 'Store', icon: Package },
  { to: '/gallery', label: 'Gallery', icon: Image },
  { to: '/custom-order', label: 'Custom Order', icon: ClipboardList },
];

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { totalItems } = useCart();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const cartCount = totalItems();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      toast.success('Logged out successfully');
    } else {
      try {
        await login();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        if (msg === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('Login failed. Please try again.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/assets/generated/creative-prints-logo-transparent.dim_200x200.png"
                alt="Creative Prints and Design"
                className="w-9 h-9 object-contain"
              />
              <span className="font-bold text-lg text-foreground hidden sm:block leading-tight">
                Creative Prints<br />
                <span className="text-primary text-sm font-medium">& Design</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  activeProps={{ className: 'px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-muted' }}
                >
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                  activeProps={{ className: 'px-3 py-2 rounded-lg text-sm font-medium text-primary bg-primary/10 flex items-center gap-1.5' }}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link to="/checkout" className="relative">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Auth */}
              <Button
                variant={isAuthenticated ? 'outline' : 'default'}
                size="sm"
                className="hidden sm:flex rounded-full gap-1.5"
                onClick={handleAuth}
                disabled={loginStatus === 'logging-in'}
              >
                {loginStatus === 'logging-in' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </span>
                ) : isAuthenticated ? (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    Login
                  </>
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-sm">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  activeProps={{ className: 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground bg-muted' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => { handleAuth(); setMobileOpen(false); }}
                  disabled={loginStatus === 'logging-in'}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isAuthenticated ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img
                  src="/assets/generated/creative-prints-logo-transparent.dim_200x200.png"
                  alt="Creative Prints and Design"
                  className="w-8 h-8 object-contain"
                />
                <span className="font-bold text-foreground">Creative Prints & Design</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                High-quality 3D printing services for prototypes, figurines, custom parts, and more.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact</h4>
              <p className="text-muted-foreground text-sm">
                Have a custom project in mind? Use our Custom Order form to get started.
              </p>
              <Link to="/custom-order" className="mt-2 inline-block">
                <Button variant="outline" size="sm" className="rounded-full mt-2">
                  Get a Quote
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Creative Prints & Design. All rights reserved.</p>
            <p>
              Built with{' '}
              <span className="text-primary">♥</span>{' '}
              using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'creative-prints-design')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
