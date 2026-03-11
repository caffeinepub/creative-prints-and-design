import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  FileCheck,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { Product } from "../../backend";
import {
  useAddProduct,
  useDeleteProduct,
  useGetAllProducts,
  useUpdateProduct,
} from "../../hooks/useQueries";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  imageFile: File | null;
  existingImageUrl?: string;
}

const defaultForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  imageFile: null,
};

// ---- Product Detail Modal ----
function ProductDetailModal({
  product,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteProduct = useDeleteProduct();

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Product deleted");
      setConfirmDelete(false);
      onDelete();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent className="max-w-lg" data-ocid="products.detail.modal">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-lg overflow-hidden border border-border aspect-video bg-muted">
              <img
                src={product.image.getDirectURL()}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/assets/generated/sample-prototype.dim_400x400.jpg";
                }}
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Name</p>
              <p className="font-semibold text-foreground text-base">
                {product.name}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                {product.description}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Price</p>
              <p className="font-bold text-primary text-lg">
                ${(Number(product.price) / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              data-ocid="products.detail.delete_button"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                data-ocid="products.detail.edit_button"
              >
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                data-ocid="products.detail.close_button"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent data-ocid="products.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{product.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="products.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="products.delete.confirm_button"
            >
              {deleteProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ProductsManagement() {
  const { data: products, isLoading } = useGetAllProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddDialog = () => {
    setEditingProduct(null);
    setForm(defaultForm);
    setUploadProgress(0);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setDetailProduct(null);
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: (Number(product.price) / 100).toFixed(2),
      imageFile: null,
      existingImageUrl: product.image.getDirectURL(),
    });
    setUploadProgress(0);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim() || !form.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const priceInCents = Math.round(Number.parseFloat(form.price) * 100);
    if (Number.isNaN(priceInCents) || priceInCents <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!editingProduct && !form.imageFile) {
      toast.error("Please upload a product image");
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      let imageBlob: ExternalBlob;

      if (form.imageFile) {
        const bytes = new Uint8Array(await form.imageFile.arrayBuffer());
        imageBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress(pct);
        });
      } else if (editingProduct) {
        imageBlob = editingProduct.image;
      } else {
        toast.error("Image is required");
        return;
      }

      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          name: form.name.trim(),
          description: form.description.trim(),
          price: BigInt(priceInCents),
          image: imageBlob,
        });
        toast.success("Product updated successfully");
      } else {
        const id = `product-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await addProduct.mutateAsync({
          id,
          name: form.name.trim(),
          description: form.description.trim(),
          price: BigInt(priceInCents),
          image: imageBlob,
        });
        toast.success("Product added successfully");
      }

      setDialogOpen(false);
      setForm(defaultForm);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} product
            {(products?.length ?? 0) !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any product to see full details, edit, or delete
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="gap-2"
          data-ocid="products.add_button"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="products.loading_state"
        >
          {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((sk) => (
            <Card key={sk}>
              <Skeleton className="aspect-video w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!products || products.length === 0) && (
        <div
          className="text-center py-16 space-y-3"
          data-ocid="products.empty_state"
        >
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">
            No products yet. Add your first product!
          </p>
        </div>
      )}

      {!isLoading && products && products.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="products.list"
        >
          {products.map((product, idx) => (
            <Card
              key={product.id}
              className="overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              onClick={() => setDetailProduct(product)}
              data-ocid={`products.item.${idx + 1}`}
            >
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={product.image.getDirectURL()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/generated/sample-prototype.dim_400x400.jpg";
                  }}
                />
              </div>
              <CardContent className="p-4 space-y-1">
                <h3 className="font-semibold text-foreground truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                <p className="text-sm font-bold text-primary">
                  ${(Number(product.price) / 100).toFixed(2)}
                </p>
                <p className="text-xs text-primary/70 pt-0.5">Click to view</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          open={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={() => openEditDialog(detailProduct)}
          onDelete={() => setDetailProduct(null)}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prod-name">Product Name *</Label>
              <Input
                id="prod-name"
                placeholder="e.g. Dragon Figurine"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                data-ocid="products.form.name.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-desc">Description *</Label>
              <Textarea
                id="prod-desc"
                placeholder="Describe the product..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                required
                data-ocid="products.form.description.textarea"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-price">Price (USD) *</Label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 24.99"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                data-ocid="products.form.price.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-image">
                Product Image{" "}
                {editingProduct ? "(leave empty to keep current)" : "*"}
              </Label>
              {form.existingImageUrl && !form.imageFile && (
                <div className="rounded-lg overflow-hidden border border-border h-32">
                  <img
                    src={form.existingImageUrl}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  id="prod-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, imageFile: e.target.files?.[0] ?? null })
                  }
                  className="hidden"
                />
                <label htmlFor="prod-image" className="cursor-pointer">
                  {form.imageFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <FileCheck className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {form.imageFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload image
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="products.form.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-ocid="products.form.submit_button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingProduct ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
