import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../hooks/useCart';
import { useSubmitStoreOrder } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ExternalBlob } from '../backend';

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const submitOrder = useSubmitStoreOrder();

  const [form, setForm] = useState<CustomerForm>({ name: '', email: '', phone: '', address: '' });
  const [errors, setErrors] = useState<Partial<CustomerForm>>({});
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCents = totalPrice();
  const totalDollars = totalCents / 100;

  const validate = (): boolean => {
    const newErrors: Partial<CustomerForm> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!form.address.trim()) newErrors.address = 'Shipping address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      let paymentProofBlob: ExternalBlob | null = null;
      if (paymentProofFile) {
        const bytes = new Uint8Array(await paymentProofFile.arrayBuffer());
        paymentProofBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
      }

      // Submit one order per cart item
      const orderIds: string[] = [];
      for (const item of items) {
        const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        orderIds.push(orderId);
        await submitOrder.mutateAsync({
          id: orderId,
          customerName: form.name,
          email: form.email,
          phone: form.phone,
          productId: item.productId,
          productName: item.productName,
          productDescription: item.productDescription,
          productPrice: BigInt(item.productPrice * item.quantity),
          paymentProof: paymentProofBlob,
        });
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate({
        to: '/order-success',
        search: {
          name: form.name,
          total: totalDollars.toFixed(2),
          items: items.length.toString(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingCart className="w-20 h-20 text-muted-foreground mx-auto mb-6 opacity-30" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to your cart before checking out.</p>
          <Link to="/store">
            <Button className="rounded-full px-8">Browse Products</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/store">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground text-sm">Review your order and enter your details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.productName}</h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 mt-0.5">{item.productDescription}</p>
                    <p className="text-primary font-semibold mt-1">
                      ${(item.productPrice / 100).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      ${((item.productPrice * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Venmo Payment Info */}
            <div className="bg-muted/50 border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-2">Payment via Venmo</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Please send your payment of <span className="font-bold text-foreground">${totalDollars.toFixed(2)}</span> to our Venmo account before submitting your order.
              </p>
              <div className="flex items-center gap-4">
                <img src="/assets/generated/venmo-qr-code.dim_300x300.png" alt="Venmo QR Code" className="w-24 h-24 rounded-lg border border-border" />
                <div>
                  <p className="text-sm font-medium text-foreground">Scan QR code or search:</p>
                  <p className="text-primary font-bold text-lg">@CreativePrints</p>
                  <p className="text-xs text-muted-foreground mt-1">Include your name in the payment note</p>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="paymentProof" className="text-sm font-medium">
                  Upload Payment Screenshot (optional)
                </Label>
                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  onChange={(e) => setPaymentProofFile(e.target.files?.[0] ?? null)}
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5 sticky top-6">
              <h2 className="text-lg font-semibold text-foreground">Your Details</h2>

              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Shipping Address *</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main St, City, State, ZIP"
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && <p className="text-destructive text-xs">{errors.address}</p>}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Total ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="text-xl font-bold text-primary">${totalDollars.toFixed(2)}</span>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By placing your order, you confirm that you have sent the Venmo payment.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
