import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import GalleryManagement from "../components/admin/GalleryManagement";
import OrdersManagement from "../components/admin/OrdersManagement";
import PaymentsManagement from "../components/admin/PaymentsManagement";
import ProductsManagement from "../components/admin/ProductsManagement";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useIsCallerAdmin,
  useRegisterUserProfile,
  useVerifyAndEnsureAdminStatus,
} from "../hooks/useQueries";

const ADMIN_EMAIL = "lanepeevy@gmail.com";
const ADMIN_NAME = "Lane Peevy";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { identity, login, loginStatus, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const {
    data: isAdmin,
    isLoading: adminLoading,
    refetch: refetchAdmin,
  } = useIsCallerAdmin();
  const verifyAdmin = useVerifyAndEnsureAdminStatus();
  const registerProfile = useRegisterUserProfile();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileEmail, setProfileEmail] = useState(ADMIN_EMAIL);
  const [profileName, setProfileName] = useState(ADMIN_NAME);
  const [autoSetupAttempted, setAutoSetupAttempted] = useState(false);

  const registerMutate = registerProfile.mutate;
  const registerIsPending = registerProfile.isPending;
  const verifyMutate = verifyAdmin.mutate;
  const verifyIsPending = verifyAdmin.isPending;

  // Auto-setup: if authenticated and no profile yet, auto-register with admin credentials
  useEffect(() => {
    if (
      isAuthenticated &&
      profileFetched &&
      userProfile === null &&
      !autoSetupAttempted &&
      !registerIsPending
    ) {
      setAutoSetupAttempted(true);
      // Auto-register with admin email so the user doesn't have to type anything
      registerMutate(
        { email: ADMIN_EMAIL, name: ADMIN_NAME },
        {
          onSuccess: () => {
            verifyMutate(undefined, {
              onSuccess: () => {
                refetchAdmin();
              },
            });
          },
          onError: () => {
            // If auto-setup fails, show manual profile setup form
            setShowProfileSetup(true);
          },
        },
      );
    }
  }, [
    isAuthenticated,
    profileFetched,
    userProfile,
    autoSetupAttempted,
    registerIsPending,
    registerMutate,
    verifyMutate,
    refetchAdmin,
  ]);

  // If user has a profile but isn't admin yet, try to verify/promote
  useEffect(() => {
    if (
      isAuthenticated &&
      userProfile &&
      !isAdmin &&
      !adminLoading &&
      !verifyIsPending
    ) {
      verifyMutate(undefined, {
        onSuccess: () => {
          refetchAdmin();
        },
      });
    }
  }, [
    isAuthenticated,
    userProfile,
    isAdmin,
    adminLoading,
    verifyIsPending,
    verifyMutate,
    refetchAdmin,
  ]);

  const handleProfileSetup = async () => {
    if (!profileEmail.trim() || !profileName.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    try {
      await registerProfile.mutateAsync({
        email: profileEmail.trim(),
        name: profileName.trim(),
      });
      toast.success("Profile saved! Verifying admin access...");
      setShowProfileSetup(false);
      await verifyAdmin.mutateAsync();
      refetchAdmin();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    }
  };

  // Loading state
  const isAutoSettingUp =
    isAuthenticated &&
    profileFetched &&
    userProfile === null &&
    !autoSetupAttempted;
  const isVerifying =
    isAuthenticated &&
    (adminLoading ||
      profileLoading ||
      registerProfile.isPending ||
      verifyAdmin.isPending ||
      isAutoSettingUp);

  if (isInitializing || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show Internet Identity login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
            <p className="text-muted-foreground mt-2">
              Sign in with Internet Identity to access the admin dashboard.
            </p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full"
            data-ocid="admin.login.button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign In with Internet Identity"
            )}
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/" })}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Manual profile setup fallback (if auto-setup failed)
  if (showProfileSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Set Up Admin Profile</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Link your identity to the admin account.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Your Name</Label>
              <Input
                id="profile-name"
                placeholder="Your name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <Input
                id="profile-email"
                type="email"
                placeholder="lanepeevy@gmail.com"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                data-ocid="admin.profile.email.input"
              />
            </div>
            <Button
              onClick={handleProfileSetup}
              disabled={registerProfile.isPending || verifyAdmin.isPending}
              className="w-full"
              data-ocid="admin.profile.submit_button"
            >
              {registerProfile.isPending || verifyAdmin.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                "Continue to Admin Dashboard"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
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
              This Internet Identity account does not have admin privileges.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage products, orders, gallery, and payments
            </p>
          </div>
        </div>
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
