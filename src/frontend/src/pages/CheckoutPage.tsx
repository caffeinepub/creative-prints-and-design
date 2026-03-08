import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  FileCheck,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  computeTotalItems,
  computeTotalPrice,
  useCart,
} from "../hooks/useCart";
import { useSubmitStoreOrder } from "../hooks/useQueries";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const totalItems = computeTotalItems(items);
  const totalPrice = computeTotalPrice(items);
  const submitOrder = useSubmitStoreOrder();

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPaymentProofFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      setIsSubmitting(true);

      let paymentProofBlob: ExternalBlob | null = null;
      if (paymentProofFile) {
        const bytes = new Uint8Array(await paymentProofFile.arrayBuffer());
        paymentProofBlob = ExternalBlob.fromBytes(bytes).withUploadProgress(
          (pct) => {
            setUploadProgress(pct);
          },
        );
      }

      // Submit one order per cart item
      for (const item of items) {
        const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await submitOrder.mutateAsync({
          id: orderId,
          customerName: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          productId: item.productId,
          productName: item.productName,
          productDescription: item.productDescription,
          productPrice: item.productPrice,
          paymentProof: paymentProofBlob,
        });
      }

      // Capture totals BEFORE clearing the cart
      const capturedTotal = totalPrice;
      const capturedItemCount = totalItems;
      clearCart();
      navigate({
        to: "/order-success",
        search: {
          customerName: customerName.trim(),
          itemCount: capturedItemCount,
          total: capturedTotal,
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-muted">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground mt-2">
            Add some products to get started.
          </p>
        </div>
        <Button asChild>
          <Link to="/store">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cart Items */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-16 w-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${(Number(item.productPrice) / 100).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        if (item.quantity <= 1) removeFromCart(item.productId);
                        else updateQuantity(item.productId, item.quantity - 1);
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">
                  ${(totalPrice / 100).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground">
                Payment via Venmo
              </h3>
              <p className="text-sm text-muted-foreground">
                Please send your payment to our Venmo account and upload a
                screenshot as proof of payment.
              </p>
              <div className="flex justify-center">
                <img
                  src="/assets/generated/venmo-qr-code.dim_300x300.png"
                  alt="Venmo QR Code"
                  className="h-32 w-32 object-contain rounded-lg border border-border"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-primary">@Tyler-Peevy</p>
                <p className="text-xs text-muted-foreground">
                  Scan the QR code or search Venmo for{" "}
                  <span className="font-medium">@Tyler-Peevy</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Details Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Shipping Address</Label>
                  <Input
                    id="address"
                    placeholder="Your shipping address (optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Payment Proof Upload */}
                <div className="space-y-2">
                  <Label htmlFor="payment-proof">
                    Payment Proof (Optional)
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="payment-proof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="payment-proof" className="cursor-pointer">
                      {paymentProofFile ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <FileCheck className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            {paymentProofFile.name}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            Upload Venmo payment screenshot
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || submitOrder.isPending}
                  size="lg"
                >
                  {isSubmitting || submitOrder.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    `Place Order — $${(totalPrice / 100).toFixed(2)}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
