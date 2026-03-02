import React, { useState } from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllStoreOrders, useUpdateStoreOrderStatus } from '../../hooks/useQueries';
import type { StoreOrder } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' },
  processing: { label: 'Processing', icon: RefreshCw, variant: 'default' },
  shipped: { label: 'Shipped', icon: Truck, variant: 'outline' },
  completed: { label: 'Completed', icon: CheckCircle, variant: 'default' },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'destructive' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1 capitalize">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function OrderRow({ order, onStatusChange, isUpdating }: {
  order: StoreOrder;
  onStatusChange: (id: string, status: string) => void;
  isUpdating: boolean;
}) {
  const priceInDollars = (Number(order.productPrice) / 100).toFixed(2);
  const date = new Date(Number(order.timestamp) / 1_000_000);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate">
        {order.id.slice(0, 16)}...
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-foreground text-sm">{order.customerName}</p>
          <p className="text-muted-foreground text-xs">{order.email}</p>
          {order.phone && <p className="text-muted-foreground text-xs">{order.phone}</p>}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-foreground text-sm">{order.productName}</p>
          <p className="text-muted-foreground text-xs line-clamp-1">{order.productDescription}</p>
        </div>
      </TableCell>
      <TableCell className="font-bold text-primary">${priceInDollars}</TableCell>
      <TableCell>
        <StatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">{dateStr}</TableCell>
      <TableCell>
        {order.paymentProof && (
          <a
            href={order.paymentProof.getDirectURL()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-xs"
          >
            View Proof
          </a>
        )}
      </TableCell>
      <TableCell>
        <Select
          value={order.status}
          onValueChange={(val) => onStatusChange(order.id, val)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-36 h-8 text-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export default function OrdersManagement() {
  const { data: orders, isLoading, error, refetch } = useGetAllStoreOrders();
  const updateStatus = useUpdateStoreOrderStatus();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Order status updated to ${status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const filteredOrders = (orders ?? []).filter((o) =>
    filterStatus === 'all' ? true : o.status.toLowerCase() === filterStatus
  );

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Failed to load orders</p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-full gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Store Orders</h2>
          <p className="text-muted-foreground text-sm">{orders?.length ?? 0} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map((s) => {
          const count = (orders ?? []).filter((o) => o.status.toLowerCase() === s).length;
          const config = STATUS_CONFIG[s];
          const Icon = config.icon;
          return (
            <div key={s} className="bg-card border border-border rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {sortedOrders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium">No orders found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {filterStatus !== 'all' ? `No ${filterStatus} orders` : 'Orders will appear here once customers place them'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Total</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="text-xs">Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    isUpdating={updateStatus.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
