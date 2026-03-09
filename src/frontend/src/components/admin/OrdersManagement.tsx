import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ExternalLink,
  Loader2,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CustomOrder, StoreOrder } from "../../backend";
import {
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

function StoreOrderRow({ order }: { order: StoreOrder }) {
  const updateStatus = useUpdateStoreOrderStatus();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await updateStatus.mutateAsync({ id: order.id, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const date = new Date(Number(order.timestamp) / 1_000_000);

  return (
    <TableRow>
      <TableCell>
        <Badge
          variant="outline"
          className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20"
        >
          Store
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
        {order.id.slice(0, 16)}...
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-foreground">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.email}</p>
          {order.phone && (
            <p className="text-xs text-muted-foreground">{order.phone}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm font-medium text-foreground">
            {order.productName}
          </p>
          <p className="text-xs text-muted-foreground">
            ${(Number(order.productPrice) / 100).toFixed(2)}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {date.toLocaleDateString()}
      </TableCell>
      <TableCell>
        {order.paymentProof ? (
          <a
            href={order.paymentProof.getDirectURL()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </TableCell>
      <TableCell>
        <Select
          value={order.status}
          onValueChange={handleStatusChange}
          disabled={updating}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
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
      </TableCell>
    </TableRow>
  );
}

function CustomOrderRow({ order }: { order: CustomOrder }) {
  return (
    <TableRow>
      <TableCell>
        <Badge
          variant="outline"
          className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20"
        >
          Custom
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
        {order.id.slice(0, 16)}...
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
        <div>
          <p className="text-sm font-medium text-foreground">Custom Request</p>
          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">
            {order.description}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status="custom" />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">—</TableCell>
      <TableCell>
        {order.modelFile ? (
          <a
            href={order.modelFile.getDirectURL()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View File <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground italic">
          Contact customer
        </span>
      </TableCell>
    </TableRow>
  );
}

export default function OrdersManagement() {
  const { data: storeOrders, isLoading: loadingStore } = useGetAllStoreOrders();
  const { data: customOrders, isLoading: loadingCustom } =
    useGetAllCustomOrders();
  const [orderTypeFilter, setOrderTypeFilter] = useState<
    "all" | "store" | "custom"
  >("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isLoading = loadingStore || loadingCustom;

  // Combined view
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

  // Sort store orders by timestamp desc; custom orders don't have timestamps so they go last
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">All Orders</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} total order{totalCount !== 1 ? "s" : ""} ({storeCount}{" "}
            store, {customCount} custom)
          </p>
        </div>
      </div>

      {/* Order type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Type:</span>
        {(["all", "store", "custom"] as const).map((t) => (
          <Button
            key={t}
            variant={orderTypeFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderTypeFilter(t)}
            className="capitalize"
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
              <SelectTrigger className="w-36 h-8 text-sm">
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
        <div className="space-y-2">
          {["sk1", "sk2", "sk3", "sk4", "sk5"].map((sk) => (
            <Skeleton key={sk} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-16 space-y-3">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product / Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>File / Payment</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) =>
                row.kind === "store" ? (
                  <StoreOrderRow
                    key={`store-${row.order.id}`}
                    order={row.order}
                  />
                ) : (
                  <CustomOrderRow
                    key={`custom-${row.order.id}`}
                    order={row.order}
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
