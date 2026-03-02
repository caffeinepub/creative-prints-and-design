import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSubmitCustomOrder } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, FileCheck, AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomOrderPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const submitOrder = useSubmitCustomOrder();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModelFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const hasEmail = email.trim().length > 0;
    const hasPhone = phone.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      toast.error('Please provide at least one contact method (email or phone)');
      return;
    }

    if (!description.trim()) {
      toast.error('Please describe your project');
      return;
    }

    try {
      setIsUploading(true);
      let blobFile: ExternalBlob | null = null;

      if (modelFile) {
        const bytes = new Uint8Array(await modelFile.arrayBuffer());
        blobFile = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress(pct);
        });
      }

      const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await submitOrder.mutateAsync({
        id: orderId,
        name: name.trim(),
        email: hasEmail ? email.trim() : null,
        phone: hasPhone ? phone.trim() : null,
        description: description.trim(),
        modelFile: blobFile,
      });

      toast.success('Custom order submitted successfully! We\'ll be in touch soon.');
      setName('');
      setEmail('');
      setPhone('');
      setDescription('');
      setModelFile(null);
      setUploadProgress(0);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit order. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <LogIn className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sign In Required</h1>
          <p className="text-muted-foreground mt-2">
            Please sign in to submit a custom order request.
          </p>
        </div>
        <Button onClick={login} disabled={isLoggingIn} size="lg" className="w-full">
          {isLoggingIn ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            'Sign In with Internet Identity'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Custom Order</h1>
        <p className="text-muted-foreground mt-2">
          Tell us about your project and we'll get back to you with a quote.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Fill in your contact information and describe what you need. Provide at least one contact method.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>Please provide at least one contact method (email or phone number).</span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail — dimensions, material preferences, quantity, intended use, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="model-file">3D Model File (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  id="model-file"
                  type="file"
                  accept=".stl,.obj,.3mf,.step,.stp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="model-file" className="cursor-pointer">
                  {modelFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <FileCheck className="h-5 w-5" />
                      <span className="text-sm font-medium">{modelFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload .STL, .OBJ, .3MF, or .STEP file
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {isUploading && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitOrder.isPending || isUploading}
            >
              {submitOrder.isPending || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Custom Order'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
