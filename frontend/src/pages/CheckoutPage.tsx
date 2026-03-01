import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubmitPaymentConfirmation, useSubmitStoreOrder } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Upload, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import AuthDialog from '../components/AuthDialog';

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const submitPayment = useSubmitPaymentConfirmation();
  const submitStoreOrder = useSubmitStoreOrder();
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Invalid file type', {
          description: 'Please upload a JPG, PNG, or WebP image',
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Authentication required', {
        description: 'Please log in to submit payment confirmation',
      });
      setAuthDialogOpen(true);
      return;
    }

    if (!file) {
      toast.error('File required', {
        description: 'Please upload proof of payment',
      });
      return;
    }

    try {
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(fileBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await submitPayment.mutateAsync({
        id: `payment-${Date.now()}`,
        customerName,
        orderId,
        proofFile: blob,
      });

      if (productId && productName && productPrice && email && phone) {
        await submitStoreOrder.mutateAsync({
          id: `store-order-${Date.now()}`,
          customerName,
          email,
          phone,
          productId,
          productName,
          productDescription: productDescription || '',
          productPrice: BigInt(Math.round(parseFloat(productPrice) * 100)),
          paymentProof: blob,
        });
      }

      setSubmitted(true);
      toast.success('Payment confirmation submitted!', {
        description: 'Thank you for your payment. We will process your order shortly.',
      });

      setCustomerName('');
      setOrderId('');
      setEmail('');
      setPhone('');
      setProductId('');
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setFile(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Failed to submit payment:', error);
      toast.error('Failed to submit payment', {
        description: error.message || 'Please try again later.',
      });
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Thank You for Your Payment!</h2>
              <p className="text-muted-foreground">
                Your payment confirmation has been received. We will process your order and contact you soon.
              </p>
              <Button onClick={() => setSubmitted(false)} className="mt-4">
                Submit Another Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Checkout & Payment</h1>
          <p className="text-lg text-muted-foreground">
            Complete your order by sending payment via Venmo and uploading proof of payment
          </p>
        </div>

        {!isAuthenticated && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You must be logged in to submit payment confirmation.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthDialogOpen(true)}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Send Payment via Venmo</CardTitle>
              <CardDescription>
                Send your payment to our Venmo account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <img
                  src="/assets/generated/venmo-qr-code.dim_300x300.png"
                  alt="Venmo QR Code"
                  className="w-48 h-48 border-2 border-border rounded-lg"
                />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Scan QR code or send to:</p>
                  <p className="text-2xl font-bold text-primary">@Tyler-Peevy</p>
                </div>
              </div>
              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Include your order ID or name in the Venmo payment note
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Upload Payment Proof</CardTitle>
              <CardDescription>
                Submit a screenshot of your Venmo payment confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Your Name *</Label>
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID / Reference *</Label>
                  <Input
                    id="orderId"
                    type="text"
                    placeholder="e.g., Custom Order or Product Name"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Payment Proof Screenshot *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    required
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {file.name}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Optional: Store Order Details</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    If this is for a store product purchase, fill in the details below
                  </p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productId">Product ID</Label>
                      <Input
                        id="productId"
                        type="text"
                        placeholder="e.g., prod-001"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        type="text"
                        placeholder="e.g., Dragon Figurine"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productDescription">Product Description</Label>
                      <Input
                        id="productDescription"
                        type="text"
                        placeholder="Brief description"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productPrice">Price ($)</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {(submitPayment.isError || submitStoreOrder.isError) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to submit payment. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitPayment.isPending || submitStoreOrder.isPending || !isAuthenticated}
                >
                  {submitPayment.isPending || submitStoreOrder.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Submit Payment Confirmation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Open your Venmo app or scan the QR code above</li>
              <li>Send payment to <strong className="text-foreground">@Tyler-Peevy</strong></li>
              <li>Include your order ID or name in the payment note</li>
              <li>Take a screenshot of the payment confirmation</li>
              <li>Upload the screenshot using the form above</li>
              <li>We'll process your order once payment is verified</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
