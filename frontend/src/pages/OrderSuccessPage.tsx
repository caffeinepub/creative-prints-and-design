import { Link } from '@tanstack/react-router';
import { useSearch } from '@tanstack/react-router';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OrderSuccessPage() {
  const search = useSearch({ from: '/order-success' });
  const { customerName, itemCount, total } = search as {
    customerName: string;
    itemCount: number;
    total: number;
  };

  const steps = [
    {
      icon: Mail,
      title: 'Order Received',
      description: 'We\'ve received your order and will review it shortly.',
    },
    {
      icon: Package,
      title: 'Production',
      description: 'Your items will be printed and quality-checked.',
    },
    {
      icon: CheckCircle,
      title: 'Delivery',
      description: 'Your order will be shipped or ready for pickup.',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="p-5 rounded-full bg-green-500/10">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Order Placed Successfully!
        </h1>
        {customerName && (
          <p className="text-lg text-muted-foreground">
            Thank you, <span className="font-semibold text-foreground">{customerName}</span>!
          </p>
        )}
      </div>

      {/* Order Details */}
      <Card className="text-left">
        <CardContent className="p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Order Summary</h2>
          {itemCount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items ordered</span>
              <span className="font-medium">{itemCount}</span>
            </div>
          )}
          {total > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total amount</span>
              <span className="font-medium text-primary">${(total / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment method</span>
            <span className="font-medium">Venmo</span>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <div className="space-y-4 text-left">
        <h2 className="text-lg font-semibold text-foreground text-center">What Happens Next?</h2>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link to="/store">
            Continue Shopping <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
