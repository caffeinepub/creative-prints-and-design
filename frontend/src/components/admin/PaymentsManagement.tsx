import { useGetAllPaymentConfirmations } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function PaymentsManagement() {
  const { data: payments, isLoading } = useGetAllPaymentConfirmations();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const sortedPayments = payments
    ? [...payments].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];

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
        <CardTitle>Payment Confirmations</CardTitle>
        <CardDescription>View all payment confirmation submissions (sorted by newest first)</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedPayments.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="text-right">Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {formatDate(payment.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">{payment.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.orderId}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProof(payment.proofFile.getDirectURL())}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Payment Proof - {payment.customerName}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <img
                              src={payment.proofFile.getDirectURL()}
                              alt="Payment proof"
                              className="w-full h-auto rounded-lg"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No payment confirmations yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
