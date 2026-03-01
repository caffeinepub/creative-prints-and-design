import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useVerifyAdminStatus } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Package, Image, ShoppingCart, CreditCard, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductsManagement from '../components/admin/ProductsManagement';
import GalleryManagement from '../components/admin/GalleryManagement';
import OrdersManagement from '../components/admin/OrdersManagement';
import PaymentsManagement from '../components/admin/PaymentsManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: isAdmin, isLoading, isError, error, refetch } = useVerifyAdminStatus();
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Not logged in at all
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8 max-w-md">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
          <Button onClick={() => navigate({ to: '/' })}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // Loading state — wait for backend verification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const techDetails = `User: ${user?.email ?? 'unknown'}\nError: ${errorMessage}\nTimestamp: ${new Date().toISOString()}`;

    const handleCopy = () => {
      navigator.clipboard.writeText(techDetails).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-lg w-full mx-4 space-y-4 p-8 border border-destructive/30 rounded-xl bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
            <h1 className="text-xl font-bold text-foreground">Admin Verification Failed</h1>
          </div>
          <p className="text-muted-foreground text-sm">{errorMessage}</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
            <Button onClick={() => setShowTechDetails(v => !v)} variant="ghost" size="sm">
              {showTechDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
          {showTechDetails && (
            <div className="bg-muted rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all">
              {techDetails}
              <Button onClick={handleCopy} variant="ghost" size="sm" className="mt-2 w-full">
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Backend says not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8 max-w-md">
          <Shield className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            Your account (<span className="font-medium">{user?.email}</span>) does not have admin privileges.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Re-check Access
            </Button>
            <Button onClick={() => navigate({ to: '/' })}>Go to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Admin confirmed — render dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Logged in as {user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsManagement />
          </TabsContent>
          <TabsContent value="gallery">
            <GalleryManagement />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersManagement />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
