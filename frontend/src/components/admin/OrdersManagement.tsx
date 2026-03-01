import { useState, useMemo } from 'react';
import { useGetAllUnifiedOrders } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Mail, Phone, ArrowUpDown, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UnifiedOrder } from '../../backend';
import { OrderType } from '../../backend';

type SortField = 'id' | 'customerName' | 'email' | 'orderType' | 'timestamp';
type SortDirection = 'asc' | 'desc';

export default function OrdersManagement() {
  const { data: orders, isLoading } = useGetAllUnifiedOrders();
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'store'>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredOrders = useMemo(() => {
    if (!orders) return [];

    // Filter orders
    let filtered = orders;
    if (filterType !== 'all') {
      filtered = orders.filter(order => {
        if (filterType === 'custom') return order.orderType === OrderType.custom;
        if (filterType === 'store') return order.orderType === OrderType.store;
        return true;
      });
    }

    // Sort orders
    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'customerName':
          aValue = a.customerName.toLowerCase();
          bValue = b.customerName.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'orderType':
          aValue = a.orderType === OrderType.custom ? 'custom' : 'store';
          bValue = b.orderType === OrderType.custom ? 'custom' : 'store';
          break;
        case 'timestamp':
          aValue = Number(a.timestamp);
          bValue = Number(b.timestamp);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, sortField, sortDirection, filterType]);

  const handleDownloadFile = async (orderId: string, file: any, fileName: string) => {
    try {
      const bytes = await file.getBytes();
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>View all custom and store orders in one unified list</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="custom">Custom Only</SelectItem>
                <SelectItem value="store">Store Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedAndFilteredOrders && sortedAndFilteredOrders.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-semibold"
                      onClick={() => handleSort('orderType')}
                    >
                      Type
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-semibold"
                      onClick={() => handleSort('id')}
                    >
                      Order ID
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-semibold"
                      onClick={() => handleSort('customerName')}
                    >
                      Customer
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-semibold"
                      onClick={() => handleSort('email')}
                    >
                      Contact
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-semibold"
                      onClick={() => handleSort('timestamp')}
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Files</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Badge variant={order.orderType === OrderType.custom ? 'default' : 'secondary'}>
                        {order.orderType === OrderType.custom ? 'Custom' : 'Store'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {order.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${order.email}`} className="text-primary hover:underline">
                              {order.email}
                            </a>
                          </div>
                        )}
                        {order.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${order.phone}`} className="text-primary hover:underline">
                              {order.phone}
                            </a>
                          </div>
                        )}
                        {!order.email && !order.phone && (
                          <span className="text-muted-foreground text-xs">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {order.orderType === OrderType.custom ? (
                        <p className="text-sm truncate">{order.description}</p>
                      ) : (
                        <div className="text-sm">
                          <p className="font-medium">{order.productName}</p>
                          <p className="text-muted-foreground truncate">{order.productDescription}</p>
                          <p className="font-semibold text-primary mt-1">
                            ${order.productPrice ? Number(order.productPrice).toFixed(2) : '0.00'}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.timestamp)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {order.modelFile ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(order.id, order.modelFile, `model-${order.id}.stl`)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Model
                          </Button>
                        ) : order.orderType === OrderType.custom ? (
                          <Badge variant="outline" className="text-xs">
                            No file uploaded
                          </Badge>
                        ) : null}
                        {order.paymentProof && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(order.id, order.paymentProof, `payment-${order.id}.jpg`)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Payment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {filterType === 'all' ? 'No orders yet.' : `No ${filterType} orders yet.`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
