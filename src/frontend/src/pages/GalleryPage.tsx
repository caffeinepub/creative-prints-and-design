import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { useGetAllGalleryItems } from "../hooks/useQueries";

export default function GalleryPage() {
  const { data: items, isLoading, error } = useGetAllGalleryItems();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Our Gallery</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Explore our portfolio of completed 3D printing projects — from
          intricate figurines to functional prototypes.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {[200, 280, 360, 200, 280, 360, 200, 280, 360].map((h, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
            <div key={i} className="break-inside-avoid mb-4">
              <Skeleton
                className="w-full rounded-xl"
                style={{ height: `${h}px` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16">
          <p className="text-destructive">
            Failed to load gallery. Please try again.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && (!items || items.length === 0) && (
        <div className="text-center py-20 space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <Images className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            No Gallery Items Yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Gallery items will appear here once they've been added by the admin.
          </p>
          <Button asChild variant="outline">
            <Link to="/store">Browse Our Store</Link>
          </Button>
        </div>
      )}

      {/* Gallery Grid */}
      {!isLoading && items && items.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="break-inside-avoid mb-4">
              <Card className="overflow-hidden border border-border hover:border-primary/40 transition-colors group">
                <div className="overflow-hidden">
                  <img
                    src={item.image.getDirectURL()}
                    alt={item.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/generated/sample-prototype.dim_400x400.jpg";
                    }}
                  />
                </div>
                <CardContent className="p-4 space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
