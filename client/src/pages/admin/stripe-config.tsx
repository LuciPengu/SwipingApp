import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mcpClient } from "@/lib/mcp-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminStripePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    environment: "test" as "test" | "live",
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    isEnabled: false,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['admin', 'stripe-config'],
    queryFn: () => mcpClient.getStripeConfig(),
  });

  useEffect(() => {
    if (config) {
      setFormData({
        environment: config.environment || "test",
        publishableKey: config.publishableKey || "",
        secretKey: config.secretKey || "",
        webhookSecret: config.webhookSecret || "",
        isEnabled: config.isEnabled || false,
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => mcpClient.saveStripeConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stripe-config'] });
      toast({ title: "Success", description: "Stripe configuration saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Stripe Configuration</CardTitle>
          <CardDescription>
            Manage your Stripe API keys and webhook configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={formData.environment}
                onValueChange={(value: "test" | "live") =>
                  setFormData({ ...formData, environment: value })
                }
              >
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.environment === "test"
                  ? "Using test mode keys (sandbox environment)"
                  : "Using live mode keys (production environment)"}
              </p>
            </div>

            <div>
              <Label htmlFor="publishableKey">Publishable Key</Label>
              <Input
                id="publishableKey"
                type="text"
                placeholder="pk_test_..."
                value={formData.publishableKey}
                onChange={(e) =>
                  setFormData({ ...formData, publishableKey: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                Public key used for client-side operations
              </p>
            </div>

            <div>
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="sk_test_..."
                value={formData.secretKey}
                onChange={(e) =>
                  setFormData({ ...formData, secretKey: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                Secret key used for server-side API calls (kept private)
              </p>
            </div>

            <div>
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="whsec_..."
                value={formData.webhookSecret}
                onChange={(e) =>
                  setFormData({ ...formData, webhookSecret: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                Used to verify webhook events from Stripe
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isEnabled" className="text-base">
                  Enable Stripe Integration
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Turn on to start accepting payments through Stripe
                </p>
              </div>
              <Switch
                id="isEnabled"
                checked={formData.isEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isEnabled: checked })
                }
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Stripe Integration</span>
              <span
                className={`text-sm font-medium ${
                  formData.isEnabled ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {formData.isEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Environment</span>
              <span className="text-sm font-medium capitalize">
                {formData.environment}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Publishable Key</span>
              <span className="text-sm font-medium">
                {formData.publishableKey ? "Configured" : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Secret Key</span>
              <span className="text-sm font-medium">
                {formData.secretKey ? "Configured" : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Webhook Secret</span>
              <span className="text-sm font-medium">
                {formData.webhookSecret ? "Configured" : "Not set"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
