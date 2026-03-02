import React, { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Package, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useQueries';
import type { Product } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  imageFile: File | null;
  existingImageUrl?: string;
}

const emptyForm: ProductForm = { name: '', description: '', price: '', imageFile: null };

function ProductFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  uploadProgress,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: ProductForm) => void;
  initialData?: ProductForm;
  isSubmitting: boolean;
  uploadProgress: number;
  title: string;
}) {
  const [form, setForm] = useState<ProductForm>(initialData ?? emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm);
      setErrors({});
    }
  }, [open, initialData]);

  const validate = () => {
    const e: Partial<Record<keyof ProductForm, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) e.price = 'Valid price required';
    if (!form.imageFile && !form.existingImageUrl) e.imageFile = 'Image is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the product details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Product Name *</Label>
            <Input
              id="prod-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dragon Figurine"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-desc">Description *</Label>
            <Textarea
              id="prod-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the product..."
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-price">Price (USD) *</Label>
            <Input
              id="prod-price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 24.99"
              className={errors.price ? 'border-destructive' : ''}
            />
            {errors.price && <p className="text-destructive text-xs">{errors.price}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Product Image {form.existingImageUrl ? '(leave empty to keep current)' : '*'}</Label>
            {form.existingImageUrl && !form.imageFile && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                <img src={form.existingImageUrl} alt="Current" className="w-full h-full object-cover" />
              </div>
            )}
            <div
              className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {form.imageFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate">{form.imageFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm({ ...form, imageFile: null }); }}
                    className="text-muted-foreground hover:text-destructive ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
            />
            {errors.imageFile && <p className="text-destructive text-xs">{errors.imageFile}</p>}
          </div>

          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">Uploading image... {uploadProgress}%</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-full gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductsManagement() {
  const { data: products, isLoading, error } = useGetAllProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (form: ProductForm) => {
    if (!form.imageFile) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await form.imageFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
      const id = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const priceCents = BigInt(Math.round(parseFloat(form.price) * 100));
      await addProduct.mutateAsync({ id, name: form.name, description: form.description, price: priceCents, image: blob });
      toast.success('Product added successfully!');
      setAddOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = async (form: ProductForm) => {
    if (!editProduct) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      let blob: ExternalBlob;
      if (form.imageFile) {
        const bytes = new Uint8Array(await form.imageFile.arrayBuffer());
        blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
      } else {
        blob = ExternalBlob.fromURL(editProduct.image.getDirectURL());
      }
      const priceCents = BigInt(Math.round(parseFloat(form.price) * 100));
      await updateProduct.mutateAsync({ id: editProduct.id, name: form.name, description: form.description, price: priceCents, image: blob });
      toast.success('Product updated successfully!');
      setEditProduct(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast.success('Product deleted');
      setDeleteId(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center py-8">Failed to load products</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Products</h2>
          <p className="text-muted-foreground text-sm">{products?.length ?? 0} products in store</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      {(!products || products.length === 0) ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium">No products yet</p>
          <p className="text-muted-foreground text-sm mt-1">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden group">
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={product.image.getDirectURL()}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{product.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mt-1">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-primary font-bold">${(Number(product.price) / 100).toFixed(2)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-lg"
                      onClick={() => setEditProduct(product)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteId(product.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <ProductFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        isSubmitting={isSubmitting}
        uploadProgress={uploadProgress}
        title="Add New Product"
      />

      {/* Edit Dialog */}
      <ProductFormDialog
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSubmit={handleEdit}
        initialData={editProduct ? {
          name: editProduct.name,
          description: editProduct.description,
          price: (Number(editProduct.price) / 100).toFixed(2),
          imageFile: null,
          existingImageUrl: editProduct.image.getDirectURL(),
        } : undefined}
        isSubmitting={isSubmitting}
        uploadProgress={uploadProgress}
        title="Edit Product"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
