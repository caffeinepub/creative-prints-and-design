import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Menu, Shield, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { computeTotalItems, useCart } from "../hooks/useCart";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const totalItems = computeTotalItems(items);
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const router = useRouter();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: isAdmin } = useIsCallerAdmin();

  const handleLogin = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      router.navigate({ to: "/" });
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/store", label: "Store" },
    { to: "/gallery", label: "Gallery" },
    { to: "/custom-order", label: "Custom Order" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/assets/uploads/969b5e15-d1e8-45ae-8c6d-2e4aab629acd-3-1.jpeg"
                alt="Creative Prints and Design"
                className="h-10 w-10 object-contain rounded-full"
              />
              <span className="font-bold text-lg text-primary hidden sm:block">
                Creative Prints and Design
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                  activeOptions={{ exact: link.to === "/" }}
                >
                  {link.label}
                </Link>
              ))}
              {/* Admin link shown when logged in as admin OR always visible as a door to admin login */}
              {isAuthenticated && isAdmin ? (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                  data-ocid="nav.admin.link"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                  data-ocid="nav.admin.link"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link
                to="/checkout"
                className="relative p-2 rounded-md hover:bg-primary/10 transition-colors"
                data-ocid="nav.cart.link"
              >
                <ShoppingCart className="h-5 w-5 text-foreground/80" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                    {totalItems}
                  </Badge>
                )}
              </Link>

              {/* Login/Logout */}
              {!isInitializing && (
                <Button
                  variant={isAuthenticated ? "outline" : "default"}
                  size="sm"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="hidden md:flex"
                  data-ocid={
                    isAuthenticated ? "nav.logout.button" : "nav.login.button"
                  }
                >
                  {isLoggingIn
                    ? "Signing in..."
                    : isAuthenticated
                      ? "Sign Out"
                      : "Sign In"}
                </Button>
              )}

              {/* Mobile menu toggle */}
              <button
                type="button"
                className="md:hidden p-2 rounded-md hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                  activeOptions={{ exact: link.to === "/" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/admin"
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
                activeProps={{ className: "text-primary bg-primary/10" }}
                onClick={() => setMobileMenuOpen(false)}
                data-ocid="nav.admin.mobile.link"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
              <div className="pt-2 border-t border-border">
                {!isInitializing && (
                  <Button
                    variant={isAuthenticated ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      handleLogin();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isLoggingIn}
                    className="w-full"
                  >
                    {isLoggingIn
                      ? "Signing in..."
                      : isAuthenticated
                        ? "Sign Out"
                        : "Sign In"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/uploads/969b5e15-d1e8-45ae-8c6d-2e4aab629acd-3-1.jpeg"
                  alt="Creative Prints and Design"
                  className="h-8 w-8 object-contain rounded-full"
                />
                <span className="font-bold text-base text-primary">
                  Creative Prints and Design
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional 3D printing services for prototypes, custom parts,
                figurines, and more.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-sm mb-3 text-foreground">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-sm mb-3 text-foreground">
                Contact
              </h3>
              <p className="text-sm text-muted-foreground">
                lanepeevy@gmail.com
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Custom orders welcome — reach out for quotes.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Creative Prints and Design. All
              rights reserved.
            </p>
            <p>
              Built with <span className="text-red-500">♥</span> using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "creative-prints")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors underline underline-offset-2"
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
