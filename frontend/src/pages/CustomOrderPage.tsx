import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubmitCustomOrder } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Upload, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import AuthDialog from '../components/AuthDialog';

export default function CustomOrderPage() {
  const { isAuthenticated } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const submitOrder = useSubmitCustomOrder();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.stl', '.obj'];
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Invalid file type', {
          description: 'Please upload a .stl or .obj file',
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const validateContactInfo = (): boolean => {
    const hasEmail = email.trim().length > 0;
    const hasPhone = phone.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      setContactError('Please provide at least one contact method (email or phone number)');
      return false;
    }

    setContactError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Authentication required', {
        description: 'Please log in to submit a custom order',
      });
      setAuthDialogOpen(true);
      return;
    }

    if (!validateContactInfo()) {
      return;
    }

    try {
      let blob: ExternalBlob | null = null;
      
      if (file) {
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        blob = ExternalBlob.fromBytes(fileBytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      }

      await submitOrder.mutateAsync({
        id: `order-${Date.now()}`,
        name,
        email: email.trim() || null,
        phone: phone.trim() || null,
        description,
        modelFile: blob,
      });

      setSubmitted(true);
      toast.success('Order submitted successfully!', {
        description: 'We will contact you soon regarding your custom order.',
      });

      setName('');
      setEmail('');
      setPhone('');
      setDescription('');
      setFile(null);
      setUploadProgress(0);
      setContactError('');
    } catch (error: any) {
      console.error('Failed to submit order:', error);
      toast.error('Failed to submit order', {
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
              <h2 className="text-2xl font-bold">Order Submitted Successfully!</h2>
              <p className="text-muted-foreground">
                Thank you for your custom order. We will review your design and contact you soon with a quote and timeline.
              </p>
              <Button onClick={() => setSubmitted(false)} className="mt-4">
                Submit Another Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Custom 3D Printing Order</h1>
          <p className="text-lg text-muted-foreground">
            Tell us about your project. You can upload a 3D model or simply describe your idea.
          </p>
        </div>

        {!isAuthenticated && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You must be logged in to submit a custom order.</span>
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

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              Fill out the form below with your project details. Uploading a 3D model file is optional - you can describe your idea instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Please provide at least one contact method (email or phone number)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (contactError) setContactError('');
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (contactError) setContactError('');
                      }}
                    />
                  </div>
                </div>

                {contactError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{contactError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project in detail, including size requirements, material preferences, color, quantity, and any special instructions. If you don't have a 3D model file, describe what you'd like us to create..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">3D Model File (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept=".stl,.obj"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {file.name}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional: Upload a .stl or .obj file if you have one. Otherwise, just describe your idea in the project description above.
                </p>
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

              {submitOrder.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to submit order. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitOrder.isPending || !isAuthenticated}
              >
                {submitOrder.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Order...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Submit Custom Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
