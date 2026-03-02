import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllProducts } from '../hooks/useQueries';
import { useCart } from '../hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function ProductCard({ product }: { product: { id: string; name: string; description: string; price: bigint; image: { getDirectURL: () => string } } }) {
  const { addToCart, items } = useCart();
  const [imgError, setImgError] = useState(false);

  const cartItem = items.find((i) => i.productId === product.id);
  const priceInDollars = Number(product.price) / 100;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      productPrice: Number(product.price),
      imageUrl: product.image.getDirectURL(),
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imgError ? (
          <img
            src={product.image.getDirectURL()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground opacity-40" />
          </div>
        )}
        {cartItem && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1">
              {cartItem.quantity} in cart
            </Badge>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-lg leading-tight mb-1">{product.name}</h3>
        <p className="text-muted-foreground text-sm flex-1 line-clamp-3 mb-4">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-2xl font-bold text-primary">
            ${priceInDollars.toFixed(2)}
          </span>
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="rounded-full px-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { data: products, isLoading, error } = useGetAllProducts();
  const { totalItems } = useCart();
  const cartCount = totalItems();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b border-border py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Our 3D Printed Products
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our collection of high-quality 3D printed items. Each piece is crafted with precision and care.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Cart Bar */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Loading products...' : `${products?.length ?? 0} product${products?.length !== 1 ? 's' : ''} available`}
          </p>
          <Link to="/checkout">
            <Button variant="outline" className="relative rounded-full gap-2">
              <ShoppingCart className="w-4 h-4" />
              View Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-destructive font-medium">Failed to load products. Please try again.</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!products || products.length === 0) && (
          <div className="text-center py-24">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No products yet</h2>
            <p className="text-muted-foreground">Check back soon — new products are being added!</p>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && products && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Checkout CTA */}
        {cartCount > 0 && (
          <div className="mt-12 text-center">
            <Link to="/checkout">
              <Button size="lg" className="rounded-full px-8 gap-2">
                <ShoppingCart className="w-5 h-5" />
                Proceed to Checkout ({cartCount} item{cartCount !== 1 ? 's' : ''})
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
