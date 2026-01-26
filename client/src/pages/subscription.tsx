import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mcpClient } from "@/lib/mcp-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, Users, Ticket, FolderKanban, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

export default function SubscriptionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgradeDialog, setUpgradeDialog] = useState<{
    open: boolean;
    plan?: any;
  }>({ open: false });

  const { data: currentSub, isLoading: subLoading } = useQuery({
    queryKey: ['subscriptions', 'current'],
    queryFn: () => mcpClient.getCurrentSubscription(),
  });

  const { data: availablePlans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: () => mcpClient.getAvailablePlans(),
  });

  const upgradeMutation = useMutation({
    mutationFn: (data: { planId: string; billingCycle: 'monthly' | 'yearly' }) =>
      mcpClient.upgradePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'current'] });
      setUpgradeDialog({ open: false });
      toast({ title: "Success", description: "Plan upgraded successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade plan",
        variant: "destructive"
      });
    },
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const handleUpgrade = (plan: any) => {
    setUpgradeDialog({ open: true, plan });
  };

  const confirmUpgrade = () => {
    if (upgradeDialog.plan) {
      upgradeMutation.mutate({
        planId: upgradeDialog.plan.id,
        billingCycle,
      });
    }
  };

  if (subLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { plan, usage, subscription } = currentSub || {};

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Plan and Usage</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and monitor resource usage
        </p>
      </div>

      {/* Top Row: Current Plan + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {plan?.name || "No Plan"}
                  {subscription?.status === "active" && (
                    <Badge className="bg-blue-500">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {plan?.description || "No active subscription"}
                </CardDescription>
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Included Features</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {plan?.featureAlerts ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                  <span className={plan?.featureAlerts ? "" : "text-muted-foreground line-through"}>
                    Alerts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan?.featureReports ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                  <span className={plan?.featureReports ? "" : "text-muted-foreground line-through"}>
                    Reports
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan?.featureApiAccess ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                  <span className={plan?.featureApiAccess ? "" : "text-muted-foreground line-through"}>
                    API Access
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan?.featureCmdbAccess ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                  <span className={plan?.featureCmdbAccess ? "" : "text-muted-foreground line-through"}>
                    CMDB Access
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>Current usage across plan limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Team Members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Team Members</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {usage?.teamMembers || 0} / {plan?.maxTeamMembers || 0}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage?.teamMembers || 0, plan?.maxTeamMembers || 1)}
                  className="h-2"
                  indicatorClassName={getUsageColor(
                    getUsagePercentage(usage?.teamMembers || 0, plan?.maxTeamMembers || 1)
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(getUsagePercentage(usage?.teamMembers || 0, plan?.maxTeamMembers || 1))}% used
                </p>
              </div>

              {/* Open Tickets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Open Tickets</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {usage?.openTickets || 0} / {plan?.maxOpenTickets || 0}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage?.openTickets || 0, plan?.maxOpenTickets || 1)}
                  className="h-2"
                  indicatorClassName={getUsageColor(
                    getUsagePercentage(usage?.openTickets || 0, plan?.maxOpenTickets || 1)
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(getUsagePercentage(usage?.openTickets || 0, plan?.maxOpenTickets || 1))}% used
                </p>
              </div>

              {/* Queues */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Queues / Categories</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {usage?.queues || 0} / {plan?.maxQueues || 0}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage?.queues || 0, plan?.maxQueues || 1)}
                  className="h-2"
                  indicatorClassName={getUsageColor(
                    getUsagePercentage(usage?.queues || 0, plan?.maxQueues || 1)
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(getUsagePercentage(usage?.queues || 0, plan?.maxQueues || 1))}% used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Available Plans</h2>
        <p className="text-muted-foreground mb-4">
          Choose the plan that works best for you
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePlans?.map((availablePlan: any) => {
            const isCurrentPlan = availablePlan.id === plan?.id;
            const price = billingCycle === "monthly"
              ? availablePlan.monthlyPriceCents
              : availablePlan.yearlyPriceCents;

            return (
              <Card
                key={availablePlan.id}
                className={`relative ${
                  isCurrentPlan ? "border-primary border-2" : ""
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{availablePlan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{formatPrice(price)}</span>
                    <span className="text-muted-foreground ml-2">
                      / {billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  <CardDescription className="mt-2">
                    {availablePlan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{availablePlan.maxTeamMembers} team members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{availablePlan.maxOpenTickets} open tickets</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{availablePlan.maxQueues} queues</span>
                    </div>
                    {availablePlan.featureAlerts && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Alerts</span>
                      </div>
                    )}
                    {availablePlan.featureReports && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Reports</span>
                      </div>
                    )}
                    {availablePlan.featureApiAccess && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>API Access</span>
                      </div>
                    )}
                    {availablePlan.featureCmdbAccess && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>CMDB Access</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan}
                    onClick={() => handleUpgrade(availablePlan)}
                  >
                    {isCurrentPlan ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={upgradeDialog.open} onOpenChange={(open) => setUpgradeDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {upgradeDialog.plan?.name}?</DialogTitle>
            <DialogDescription>
              You're about to upgrade to the {upgradeDialog.plan?.name} plan with {billingCycle} billing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Plan</span>
                <span>{upgradeDialog.plan?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Billing</span>
                <span className="capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Price</span>
                <span className="text-lg font-bold">
                  {upgradeDialog.plan && formatPrice(
                    billingCycle === "monthly"
                      ? upgradeDialog.plan.monthlyPriceCents
                      : upgradeDialog.plan.yearlyPriceCents
                  )}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your new plan will be activated immediately. The current billing period will be prorated.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialog({ open: false })}
              disabled={upgradeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpgrade}
              disabled={upgradeMutation.isPending}
            >
              {upgradeMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
