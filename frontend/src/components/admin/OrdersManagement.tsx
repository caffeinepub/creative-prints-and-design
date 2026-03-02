import { useState } from 'react';
import { useGetAllStoreOrders, useUpdateStoreOrderStatus } from '../../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { StoreOrder } from '../../backend';

const STATUS_OPTIONS = ['pending', 'confirmed', 'printing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  printing: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function OrderRow({ order }: { order: StoreOrder }) {
  const updateStatus = useUpdateStoreOrderStatus();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await updateStatus.mutateAsync({ id: order.id, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const date = new Date(Number(order.timestamp) / 1_000_000);

  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
        {order.id.slice(0, 16)}...
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-foreground">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm font-medium text-foreground">{order.productName}</p>
          <p className="text-xs text-muted-foreground">${(Number(order.productPrice) / 100).toFixed(2)}</p>
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

export default function OrdersManagement() {
  const { data: orders, isLoading } = useGetAllStoreOrders();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders
    ? statusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === statusFilter)
    : [];

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  // Stats
  const stats = STATUS_OPTIONS.reduce(
    (acc, s) => {
      acc[s] = orders?.filter((o) => o.status === s).length ?? 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {orders?.length ?? 0} total order{(orders?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <Card
            key={s}
            className={`cursor-pointer transition-colors ${statusFilter === s ? 'border-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats[s]}</p>
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue />
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

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && sortedOrders.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">
            {statusFilter === 'all' ? 'No orders yet.' : `No ${statusFilter} orders.`}
          </p>
        </div>
      )}

      {!isLoading && sortedOrders.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Update Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
