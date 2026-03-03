import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Loader2, Minus, Package, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend";
import { useCart } from "../hooks/useCart";
import { useGetAllProducts } from "../hooks/useQueries";

function ProductCard({ product }: { product: Product }) {
  const { addToCart, items } = useCart();
  const cartItem = items.find((i) => i.productId === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      productPrice: product.price,
      imageUrl: product.image.getDirectURL(),
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Card className="flex flex-col overflow-hidden border border-border hover:border-primary/40 transition-colors group">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image.getDirectURL()}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/assets/generated/sample-prototype.dim_400x400.jpg";
          }}
        />
      </div>
      <CardContent className="flex-1 p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <p className="text-lg font-bold text-primary">
          ${(Number(product.price) / 100).toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {quantity === 0 ? (
          <Button onClick={handleAddToCart} className="w-full gap-2">
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const { updateQuantity, removeFromCart } = useCart.getState();
                if (quantity <= 1) removeFromCart(product.id);
                else updateQuantity(product.id, quantity - 1);
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center font-medium">{quantity}</span>
            <Button variant="outline" size="icon" onClick={handleAddToCart}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function StorePage() {
  const { data: products, isLoading, error } = useGetAllProducts();
  const { totalItems } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Our Products</h1>
          <p className="text-muted-foreground mt-1">
            Browse our collection of 3D printed products
          </p>
        </div>
        {totalItems > 0 && (
          <Button asChild className="gap-2">
            <Link to="/checkout">
              <ShoppingCart className="h-4 w-4" />
              Checkout ({totalItems})
            </Link>
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"].map(
            (sk) => (
              <Card key={sk} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
                <div className="p-4 pt-0">
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ),
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16">
          <p className="text-destructive">
            Failed to load products. Please try again.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && (!products || products.length === 0) && (
        <div className="text-center py-20 space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            No Products Yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Products will appear here once they've been added by the admin.
          </p>
          <Button asChild variant="outline">
            <Link to="/custom-order">Request a Custom Order</Link>
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && products && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
