import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useVerifyAndEnsureAdminStatus, useGetCallerUserProfile, useRegisterUserProfile } from '../hooks/useQueries';
import ProductsManagement from '../components/admin/ProductsManagement';
import OrdersManagement from '../components/admin/OrdersManagement';
import GalleryManagement from '../components/admin/GalleryManagement';
import PaymentsManagement from '../components/admin/PaymentsManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { identity, login, loginStatus, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const verifyAdmin = useVerifyAndEnsureAdminStatus();

  // Profile setup for first-time admin login
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const registerProfile = useRegisterUserProfile();

  const [profileEmail, setProfileEmail] = useState('');
  const [profileName, setProfileName] = useState('');
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && profileFetched && userProfile === null) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, profileFetched, userProfile]);

  // After profile is set, verify admin status
  useEffect(() => {
    if (isAuthenticated && userProfile && !isAdmin && !adminLoading) {
      verifyAdmin.mutate();
    }
  }, [isAuthenticated, userProfile, isAdmin, adminLoading]);

  const handleProfileSetup = async () => {
    if (!profileEmail.trim() || !profileName.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    try {
      await registerProfile.mutateAsync({ email: profileEmail.trim(), name: profileName.trim() });
      toast.success('Profile saved! Verifying admin access...');
      setShowProfileSetup(false);
      await verifyAdmin.mutateAsync();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    }
  };

  // Loading state
  if (isInitializing || (isAuthenticated && (adminLoading || profileLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
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
            <h1 className="text-2xl font-bold text-foreground">Admin Access Required</h1>
            <p className="text-muted-foreground mt-2">
              Sign in with your Internet Identity to access the admin dashboard.
            </p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In with Internet Identity'
            )}
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Profile setup for first-time login
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
            <h1 className="text-2xl font-bold">Set Up Your Profile</h1>
            <p className="text-muted-foreground mt-2">
              Enter your email to link your Internet Identity to your admin account.
              Use <strong>lanepeevy@gmail.com</strong> for admin access.
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
              />
            </div>
            <Button
              onClick={handleProfileSetup}
              disabled={registerProfile.isPending || verifyAdmin.isPending}
              className="w-full"
            >
              {registerProfile.isPending || verifyAdmin.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                'Continue to Admin Dashboard'
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
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You don't have admin privileges. Only the authorized admin account can access this dashboard.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage products, orders, gallery, and payments
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
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
