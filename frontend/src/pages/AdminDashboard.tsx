import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Shield, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ProductsManagement from '../components/admin/ProductsManagement';
import OrdersManagement from '../components/admin/OrdersManagement';
import GalleryManagement from '../components/admin/GalleryManagement';
import PaymentsManagement from '../components/admin/PaymentsManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading, error: adminError, refetch } = useIsCallerAdmin();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      toast.error('Please log in to access the admin dashboard');
      navigate({ to: '/' });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (!adminLoading && isAdmin === false && isAuthenticated) {
      toast.error('Access denied: You do not have admin privileges');
      navigate({ to: '/' });
    }
  }, [adminLoading, isAdmin, isAuthenticated, navigate]);

  // Loading state
  if (isInitializing || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (adminError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Verification Failed</h2>
          <p className="text-muted-foreground text-sm">
            {adminError instanceof Error ? adminError.message : 'Could not verify admin status.'}
          </p>
          <Button onClick={() => refetch()} className="rounded-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your Creative Prints & Design store</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="products">
          <TabsList className="mb-6 rounded-xl">
            <TabsTrigger value="products" className="rounded-lg">Products</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg">Orders</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg">Gallery</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-lg">Payments</TabsTrigger>
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
    </div>
  );
}
