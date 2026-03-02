import React from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { CheckCircle, ShoppingBag, Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSuccessPage() {
  const search = useSearch({ from: '/order-success' }) as { name?: string; total?: string; items?: string };

  const customerName = search.name ?? 'Customer';
  const total = search.total ?? '0.00';
  const itemCount = parseInt(search.items ?? '1', 10);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Order Placed! 🎉
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Thank you, <span className="font-semibold text-foreground">{customerName}</span>! Your order has been received and is being processed.
        </p>

        {/* Order Details Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left space-y-4">
          <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items ordered</span>
              <span className="font-medium text-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-bold text-primary text-base">${total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment method</span>
              <span className="font-medium text-foreground">Venmo</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-muted/50 border border-border rounded-2xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-none">
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              We'll verify your Venmo payment
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              Your 3D printed items will be prepared
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              We'll contact you with shipping details
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/store">
            <Button variant="outline" className="rounded-full px-6 gap-2 w-full sm:w-auto">
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </Button>
          </Link>
          <Link to="/">
            <Button className="rounded-full px-6 gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
