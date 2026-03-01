import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Copy, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DeploymentErrorScreenProps {
  error: Error;
  errorInfo?: React.ErrorInfo | null;
}

export default function DeploymentErrorScreen({ error, errorInfo }: DeploymentErrorScreenProps) {
  const [showDetails, setShowDetails] = useState(false);

  const copyErrorToClipboard = () => {
    const errorDetails = `
Error: ${error.name}
Message: ${error.message}
Stack: ${error.stack || 'No stack trace available'}
${errorInfo ? `\nComponent Stack: ${errorInfo.componentStack}` : ''}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      toast.success('Error details copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy error details');
    });
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Application Error
          </CardTitle>
          <CardDescription>
            An unexpected error occurred while running the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{error.name || 'Error'}</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message || 'An unknown error occurred'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between"
            >
              <span>Technical Details</span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showDetails && (
              <div className="bg-muted p-4 rounded-md space-y-3 text-sm font-mono">
                <div>
                  <div className="font-semibold text-foreground mb-1">Error Name:</div>
                  <div className="text-muted-foreground">{error.name}</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-1">Message:</div>
                  <div className="text-muted-foreground">{error.message}</div>
                </div>
                {error.stack && (
                  <div>
                    <div className="font-semibold text-foreground mb-1">Stack Trace:</div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <div className="font-semibold text-foreground mb-1">Component Stack:</div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={copyErrorToClipboard}
              variant="outline"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Error Details
            </Button>
            <Button
              onClick={handleReload}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Application
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>If this error persists:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Try clearing your browser cache and reloading</li>
              <li>Check your internet connection</li>
              <li>Copy the error details and contact support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
