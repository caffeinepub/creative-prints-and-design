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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CustomOrder, StoreOrder } from "../../backend";
import {
  useDeleteCustomOrder,
  useDeleteStoreOrder,
  useGetAllCustomOrders,
  useGetAllStoreOrders,
  useUpdateStoreOrderStatus,
} from "../../hooks/useQueries";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "printing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  printing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  shipped: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  custom: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---- Detail Modal for Store Order ----
function StoreOrderDetailModal({
  order,
  open,
  onClose,
  onDelete,
}: {
  order: StoreOrder;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteOrder = useDeleteStoreOrder();
  const updateStatus = useUpdateStoreOrderStatus();
  const [updating, setUpdating] = useState(false);
  const date = new Date(Number(order.timestamp) / 1_000_000);

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(order.id);
      toast.success("Order deleted");
      setConfirmDelete(false);
      onDelete();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete order",
      );
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await updateStatus.mutateAsync({ id: order.id, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setUpdating(false);
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
        <DialogContent
          className="max-w-lg"
          data-ocid="orders.store_detail.modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20"
              >
                Store Order
              </Badge>
              Order Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Order ID</p>
                <p className="font-mono text-xs break-all">{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                <p>
                  {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Customer</p>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.email}</p>
              {order.phone && (
                <p className="text-muted-foreground">{order.phone}</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Product</p>
              <p className="font-medium">{order.productName}</p>
              <p className="text-muted-foreground">
                {order.productDescription}
              </p>
              <p className="font-semibold mt-1">
                ${(Number(order.productPrice) / 100).toFixed(2)}
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <StatusBadge status={order.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Change Status
                </p>
                <Select
                  value={order.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger
                    className="h-8 w-36 text-xs"
                    data-ocid="orders.store_detail.select"
                  >
                    {updating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {order.paymentProof && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Payment Proof
                </p>
                <a
                  href={order.paymentProof.getDirectURL()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View Payment Proof <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              data-ocid="orders.store_detail.delete_button"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              data-ocid="orders.store_detail.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent data-ocid="orders.store_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the order for{" "}
              <strong>{order.customerName}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="orders.store_delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="orders.store_delete.confirm_button"
            >
              {deleteOrder.isPending ? (
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

// ---- Detail Modal for Custom Order ----
function CustomOrderDetailModal({
  order,
  open,
  onClose,
  onDelete,
}: {
  order: CustomOrder;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteOrder = useDeleteCustomOrder();

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(order.id);
      toast.success("Order deleted");
      setConfirmDelete(false);
      onDelete();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete order",
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
        <DialogContent
          className="max-w-lg"
          data-ocid="orders.custom_detail.modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20"
              >
                Custom Order
              </Badge>
              Order Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Order ID</p>
              <p className="font-mono text-xs break-all">{order.id}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Customer</p>
              <p className="font-medium">{order.name}</p>
              {order.email && (
                <p className="text-muted-foreground">{order.email}</p>
              )}
              {order.phone && (
                <p className="text-muted-foreground">{order.phone}</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Description / Request
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">
                {order.description}
              </p>
            </div>

            {order.modelFile && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Attached File
                  </p>
                  <a
                    href={order.modelFile.getDirectURL()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View / Download File <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              data-ocid="orders.custom_detail.delete_button"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              data-ocid="orders.custom_detail.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent data-ocid="orders.custom_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the custom order from{" "}
              <strong>{order.name}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="orders.custom_delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="orders.custom_delete.confirm_button"
            >
              {deleteOrder.isPending ? (
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

// ---- Row Components ----

function StoreOrderRow({
  order,
  index,
}: {
  order: StoreOrder;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(Number(order.timestamp) / 1_000_000);

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(true)}
        data-ocid={`orders.store_row.item.${index}`}
      >
        <TableCell>
          <Badge
            variant="outline"
            className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20"
          >
            Store
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate">
          {order.id.slice(0, 12)}...
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium text-foreground">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">{order.email}</p>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm font-medium text-foreground">
            {order.productName}
          </p>
          <p className="text-xs text-muted-foreground">
            ${(Number(order.productPrice) / 100).toFixed(2)}
          </p>
        </TableCell>
        <TableCell>
          <StatusBadge status={order.status} />
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {date.toLocaleDateString()}
        </TableCell>
        <TableCell className="text-xs text-primary">Click to view</TableCell>
      </TableRow>

      {open && (
        <StoreOrderDetailModal
          order={order}
          open={open}
          onClose={() => setOpen(false)}
          onDelete={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CustomOrderRow({
  order,
  index,
}: {
  order: CustomOrder;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(true)}
        data-ocid={`orders.custom_row.item.${index}`}
      >
        <TableCell>
          <Badge
            variant="outline"
            className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20"
          >
            Custom
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate">
          {order.id.slice(0, 12)}...
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium text-foreground">{order.name}</p>
            {order.email && (
              <p className="text-xs text-muted-foreground">{order.email}</p>
            )}
            {order.phone && (
              <p className="text-xs text-muted-foreground">{order.phone}</p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm font-medium text-foreground">Custom Request</p>
          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[160px]">
            {order.description}
          </p>
        </TableCell>
        <TableCell>
          <StatusBadge status="custom" />
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">—</TableCell>
        <TableCell className="text-xs text-primary">Click to view</TableCell>
      </TableRow>

      {open && (
        <CustomOrderDetailModal
          order={order}
          open={open}
          onClose={() => setOpen(false)}
          onDelete={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ---- Main Component ----

export default function OrdersManagement() {
  const { data: storeOrders, isLoading: loadingStore } = useGetAllStoreOrders();
  const { data: customOrders, isLoading: loadingCustom } =
    useGetAllCustomOrders();
  const [orderTypeFilter, setOrderTypeFilter] = useState<
    "all" | "store" | "custom"
  >("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isLoading = loadingStore || loadingCustom;

  type Row =
    | { kind: "store"; order: StoreOrder }
    | { kind: "custom"; order: CustomOrder };

  const allRows: Row[] = [
    ...(storeOrders ?? []).map((o): Row => ({ kind: "store", order: o })),
    ...(customOrders ?? []).map((o): Row => ({ kind: "custom", order: o })),
  ];

  const filtered = allRows.filter((row) => {
    if (orderTypeFilter === "store" && row.kind !== "store") return false;
    if (orderTypeFilter === "custom" && row.kind !== "custom") return false;
    if (
      statusFilter !== "all" &&
      row.kind === "store" &&
      row.order.status !== statusFilter
    )
      return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const tsA = a.kind === "store" ? Number(a.order.timestamp) : 0;
    const tsB = b.kind === "store" ? Number(b.order.timestamp) : 0;
    return tsB - tsA;
  });

  const storeCount = storeOrders?.length ?? 0;
  const customCount = customOrders?.length ?? 0;
  const totalCount = storeCount + customCount;

  const stats = STATUS_OPTIONS.reduce(
    (acc, s) => {
      acc[s] = storeOrders?.filter((o) => o.status === s).length ?? 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  let storeIdx = 0;
  let customIdx = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">All Orders</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} total order{totalCount !== 1 ? "s" : ""} ({storeCount}{" "}
            store, {customCount} custom)
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any row to see full details and delete
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Type:</span>
        {(["all", "store", "custom"] as const).map((t) => (
          <Button
            key={t}
            variant={orderTypeFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderTypeFilter(t)}
            className="capitalize"
            data-ocid={`orders.type_filter.${t}`}
          >
            {t === "all"
              ? "All"
              : t === "store"
                ? `Store (${storeCount})`
                : `Custom (${customCount})`}
          </Button>
        ))}

        {orderTypeFilter !== "custom" && (
          <>
            <span className="text-sm text-muted-foreground ml-4">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-36 h-8 text-sm"
                data-ocid="orders.status_filter.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {stats[s] > 0 ? ` (${stats[s]})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2" data-ocid="orders.loading_state">
          {["sk1", "sk2", "sk3", "sk4", "sk5"].map((sk) => (
            <Skeleton key={sk} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div
          className="text-center py-16 space-y-3"
          data-ocid="orders.empty_state"
        >
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="orders.table">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product / Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) =>
                row.kind === "store" ? (
                  <StoreOrderRow
                    key={`store-${row.order.id}`}
                    order={row.order}
                    index={++storeIdx}
                  />
                ) : (
                  <CustomOrderRow
                    key={`custom-${row.order.id}`}
                    order={row.order}
                    index={++customIdx}
                  />
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
