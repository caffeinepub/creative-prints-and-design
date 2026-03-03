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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  FileCheck,
  Images,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { GalleryItem } from "../../backend";
import {
  useAddGalleryItem,
  useDeleteGalleryItem,
  useGetAllGalleryItems,
  useUpdateGalleryItem,
} from "../../hooks/useQueries";

interface GalleryFormData {
  title: string;
  description: string;
  imageFile: File | null;
  existingImageUrl?: string;
}

const defaultForm: GalleryFormData = {
  title: "",
  description: "",
  imageFile: null,
};

export default function GalleryManagement() {
  const { data: items, isLoading } = useGetAllGalleryItems();
  const addItem = useAddGalleryItem();
  const updateItem = useUpdateGalleryItem();
  const deleteItem = useDeleteGalleryItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<GalleryFormData>(defaultForm);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddDialog = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setUploadProgress(0);
    setDialogOpen(true);
  };

  const openEditDialog = (item: GalleryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description,
      imageFile: null,
      existingImageUrl: item.image.getDirectURL(),
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

    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!editingItem && !form.imageFile) {
      toast.error("Please upload an image");
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
      } else if (editingItem) {
        imageBlob = editingItem.image;
      } else {
        toast.error("Image is required");
        return;
      }

      if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id,
          title: form.title.trim(),
          description: form.description.trim(),
          image: imageBlob,
        });
        toast.success("Gallery item updated");
      } else {
        const id = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await addItem.mutateAsync({
          id,
          title: form.title.trim(),
          description: form.description.trim(),
          image: imageBlob,
        });
        toast.success("Gallery item added");
      }

      setDialogOpen(false);
      setForm(defaultForm);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save gallery item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteItem.mutateAsync(deletingId);
      toast.success("Gallery item deleted");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete gallery item");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gallery</h2>
          <p className="text-sm text-muted-foreground">
            {items?.length ?? 0} item{(items?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((sk) => (
            <Card key={sk}>
              <Skeleton className="aspect-square w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <div className="text-center py-16 space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <Images className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">
            No gallery items yet. Add your first item!
          </p>
        </div>
      )}

      {!isLoading && items && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={item.image.getDirectURL()}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/generated/sample-prototype.dim_400x400.jpg";
                  }}
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(item.id)}
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
            <DialogTitle>
              {editingItem ? "Edit Gallery Item" : "Add Gallery Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-title">Title *</Label>
              <Input
                id="gallery-title"
                placeholder="e.g. Dragon Figurine"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-desc">Description</Label>
              <Textarea
                id="gallery-desc"
                placeholder="Describe this piece..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-image">
                Image {editingItem ? "(leave empty to keep current)" : "*"}
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
                  id="gallery-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, imageFile: e.target.files?.[0] ?? null })
                  }
                  className="hidden"
                />
                <label htmlFor="gallery-image" className="cursor-pointer">
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingItem ? (
                  "Update Item"
                ) : (
                  "Add Item"
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
            <AlertDialogTitle>Delete Gallery Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this gallery item? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
