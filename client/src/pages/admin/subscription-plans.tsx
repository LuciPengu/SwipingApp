import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mcpClient } from "@/lib/mcp-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MoreVertical, Check } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PlanFormData {
  name: string;
  key: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  maxTeamMembers: number;
  maxOpenTickets: number;
  maxQueues: number;
  featureAlerts: boolean;
  featureReports: boolean;
  featureApiAccess: boolean;
  featureCmdbAccess: boolean;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminPlansPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    key: "",
    description: "",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxTeamMembers: 10,
    maxOpenTickets: 100,
    maxQueues: 5,
    featureAlerts: true,
    featureReports: false,
    featureApiAccess: false,
    featureCmdbAccess: false,
    isActive: true,
    displayOrder: 0,
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: () => mcpClient.getSubscriptionPlans(),
  });

  const createMutation = useMutation({
    mutationFn: (data: PlanFormData) => mcpClient.createSubscriptionPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Plan created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Partial<PlanFormData> }) =>
      mcpClient.updateSubscriptionPlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      toast({ title: "Success", description: "Plan updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => mcpClient.deleteSubscriptionPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      setDeleteConfirm(null);
      toast({ title: "Success", description: "Plan deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      key: "",
      description: "",
      monthlyPriceCents: 0,
      yearlyPriceCents: 0,
      maxTeamMembers: 10,
      maxOpenTickets: 100,
      maxQueues: 5,
      featureAlerts: true,
      featureReports: false,
      featureApiAccess: false,
      featureCmdbAccess: false,
      isActive: true,
      displayOrder: 0,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan: any) => {
    setFormData({
      name: plan.name,
      key: plan.key,
      description: plan.description || "",
      monthlyPriceCents: plan.monthlyPriceCents,
      yearlyPriceCents: plan.yearlyPriceCents,
      maxTeamMembers: plan.maxTeamMembers,
      maxOpenTickets: plan.maxOpenTickets,
      maxQueues: plan.maxQueues,
      featureAlerts: plan.featureAlerts,
      featureReports: plan.featureReports,
      featureApiAccess: plan.featureApiAccess,
      featureCmdbAccess: plan.featureCmdbAccess,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
    });
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ planId: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl">Subscription Plans</CardTitle>
            <CardDescription>Manage pricing tiers and their limits</CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Queues</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Yearly</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.map((plan: any) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{plan.key}</Badge>
                  </TableCell>
                  <TableCell>{plan.maxTeamMembers}</TableCell>
                  <TableCell>{plan.maxOpenTickets}</TableCell>
                  <TableCell>{plan.maxQueues}</TableCell>
                  <TableCell className="text-right">{formatPrice(plan.monthlyPriceCents)}</TableCell>
                  <TableCell className="text-right">{formatPrice(plan.yearlyPriceCents)}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Feature Legend */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Feature Legend</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Alerts</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead className="text-center">API Access</TableHead>
                  <TableHead className="text-center">CMDB Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="text-center">
                      {plan.featureAlerts && <Check className="w-5 h-5 text-green-600 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.featureReports && <Check className="w-5 h-5 text-green-600 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.featureApiAccess && <Check className="w-5 h-5 text-green-600 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.featureCmdbAccess && <Check className="w-5 h-5 text-green-600 mx-auto" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Add Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update the subscription plan details" : "Create a new subscription plan"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="key">Key (slug)</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  required
                  disabled={!!editingPlan}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyPrice">Monthly Price (cents)</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  value={formData.monthlyPriceCents}
                  onChange={(e) => setFormData({ ...formData, monthlyPriceCents: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="yearlyPrice">Yearly Price (cents)</Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  value={formData.yearlyPriceCents}
                  onChange={(e) => setFormData({ ...formData, yearlyPriceCents: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxTeam">Max Team Members</Label>
                <Input
                  id="maxTeam"
                  type="number"
                  value={formData.maxTeamMembers}
                  onChange={(e) => setFormData({ ...formData, maxTeamMembers: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxTickets">Max Open Tickets</Label>
                <Input
                  id="maxTickets"
                  type="number"
                  value={formData.maxOpenTickets}
                  onChange={(e) => setFormData({ ...formData, maxOpenTickets: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxQueues">Max Queues</Label>
                <Input
                  id="maxQueues"
                  type="number"
                  value={formData.maxQueues}
                  onChange={(e) => setFormData({ ...formData, maxQueues: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Features</Label>
              <div className="flex items-center justify-between">
                <span>Alerts</span>
                <Switch
                  checked={formData.featureAlerts}
                  onCheckedChange={(checked) => setFormData({ ...formData, featureAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Reports</span>
                <Switch
                  checked={formData.featureReports}
                  onCheckedChange={(checked) => setFormData({ ...formData, featureReports: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>API Access</span>
                <Switch
                  checked={formData.featureApiAccess}
                  onCheckedChange={(checked) => setFormData({ ...formData, featureApiAccess: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>CMDB Access</span>
                <Switch
                  checked={formData.featureCmdbAccess}
                  onCheckedChange={(checked) => setFormData({ ...formData, featureCmdbAccess: checked })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Is Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingPlan ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscription plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
