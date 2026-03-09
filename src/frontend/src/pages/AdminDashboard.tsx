import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import type { backendInterface } from "../backend";
import GalleryManagement from "../components/admin/GalleryManagement";
import OrdersManagement from "../components/admin/OrdersManagement";
import PaymentsManagement from "../components/admin/PaymentsManagement";
import ProductsManagement from "../components/admin/ProductsManagement";
import { useAuth } from "../hooks/useAuth";
import { ensureAdminRegistered, resetAdminSession } from "../hooks/useQueries";

/** Get the latest actor from the query cache. */
function getActorFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
): backendInterface | null {
  const queries = queryClient.getQueriesData<backendInterface>({
    queryKey: ["actor"],
  });
  for (const [, data] of queries) {
    if (data) return data;
  }
  return null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, login, logout, isAdmin } =
    useAuth();

  const [loginEmail, setLoginEmail] = useState("lanepeevy@gmail.com");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const success = await login(loginEmail, loginPassword);
    if (!success) {
      setLoginError("Invalid email or password. Please try again.");
      return;
    }

    // After login, immediately register admin with backend.
    // Wait for actor to be available, then call saveCallerUserProfile.
    if (loginEmail.toLowerCase() === "lanepeevy@gmail.com") {
      setIsRegistering(true);
      try {
        // Poll for the actor to become available (max 10s)
        const start = Date.now();
        let actor: backendInterface | null = null;
        while (Date.now() - start < 10000) {
          actor = getActorFromCache(queryClient);
          if (actor) break;
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        if (actor) {
          await ensureAdminRegistered(actor);
        }
      } catch {
        // Non-fatal — ensureAdminRegistered will also run before each admin action
      } finally {
        setIsRegistering(false);
      }
    }
  };

  const handleLogout = () => {
    resetAdminSession();
    logout();
    navigate({ to: "/" });
  };

  // Still loading auth state or registering admin
  if (isLoading || isRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {isRegistering ? "Setting up admin access..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated — show email/password login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
            <p className="text-muted-foreground text-sm">
              Sign in with your admin email and password.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="lanepeevy@gmail.com"
                required
                data-ocid="admin.login.email.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-ocid="admin.login.password.input"
              />
            </div>

            {loginError && (
              <p className="text-sm text-destructive">{loginError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-ocid="admin.login.submit_button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate({ to: "/" })}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated but not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Access Denied
            </h1>
            <p className="text-muted-foreground mt-2">
              The account <strong>{user?.email}</strong> does not have admin
              privileges.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/" })}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full admin dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Logged in as <strong>{user?.email}</strong> &mdash; Manage
              products, orders, gallery, and payments
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          data-ocid="admin.logout.button"
        >
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" data-ocid="admin.products.tab">
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" data-ocid="admin.orders.tab">
            Orders
          </TabsTrigger>
          <TabsTrigger value="gallery" data-ocid="admin.gallery.tab">
            Gallery
          </TabsTrigger>
          <TabsTrigger value="payments" data-ocid="admin.payments.tab">
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsManagement />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersManagement />
        </TabsContent>

        <TabsContent value="gallery">
          <GalleryManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
