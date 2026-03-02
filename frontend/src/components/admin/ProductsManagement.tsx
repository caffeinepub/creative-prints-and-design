import { useState } from 'react';
import { useGetAllProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import type { Product } from '../../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Loader2, Upload, FileCheck, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  imageFile: File | null;
  existingImageUrl?: string;
}

const defaultForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  imageFile: null,
};

export default function ProductsManagement() {
  const { data: products, isLoading } = useGetAllProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim() || !form.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const priceInCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!editingProduct && !form.imageFile) {
      toast.error('Please upload a product image');
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
        toast.error('Image is required');
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
        toast.success('Product updated successfully');
      } else {
        const id = `product-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await addProduct.mutateAsync({
          id,
          name: form.name.trim(),
          description: form.description.trim(),
          price: BigInt(priceInCents),
          image: imageBlob,
        });
        toast.success('Product added successfully');
      }

      setDialogOpen(false);
      setForm(defaultForm);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProduct.mutateAsync(deletingId);
      toast.success('Product deleted');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} product{(products?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
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
        <div className="text-center py-16 space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">No products yet. Add your first product!</p>
        </div>
      )}

      {!isLoading && products && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={product.image.getDirectURL()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/generated/sample-prototype.dim_400x400.jpg';
                  }}
                />
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <p className="text-sm font-bold text-primary mt-1">
                      ${(Number(product.price) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-desc">Description *</Label>
              <Textarea
                id="prod-desc"
                placeholder="Describe the product..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                required
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-image">
                Product Image {editingProduct ? '(leave empty to keep current)' : '*'}
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
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                  className="hidden"
                />
                <label htmlFor="prod-image" className="cursor-pointer">
                  {form.imageFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <FileCheck className="h-5 w-5" />
                      <span className="text-sm font-medium">{form.imageFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>
              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingProduct ? (
                  'Update Product'
                ) : (
                  'Add Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
