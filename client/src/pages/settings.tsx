import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Tag,
  Copy,
  Check,
  Users,
  Globe,
  Plus,
  Trash2,
  Edit2,
  Coins,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Organization, SlaPolicy, TicketCategory } from "@shared/schema";

interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  domain?: string;
  createdAt?: string;
}

interface PriorityConfig {
  id: string;
  name: string;
  level: number;
  color: string;
  basePoints: number;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
}

const prioritySchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.coerce.number().min(1).max(10),
  color: z.string().min(1, "Color is required"),
  basePoints: z.coerce.number().min(0),
  responseTimeMinutes: z.coerce.number().min(1),
  resolutionTimeMinutes: z.coerce.number().min(1),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  bonusPoints: z.coerce.number().min(0).optional(),
});

type PriorityFormData = z.infer<typeof prioritySchema>;
type CategoryFormData = z.infer<typeof categorySchema>;

export default function Settings() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<PriorityConfig | null>(null);
  const [editingCategory, setEditingCategory] = useState<TicketCategory | null>(null);

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['/mcp/organizations/my'],
    queryFn: () => mcpClient.getMyOrganization() as Promise<Organization | null>,
  });

  const { data: priorities = [], isLoading: prioritiesLoading } = useQuery({
    queryKey: ['/mcp/config/priorities'],
    queryFn: () => mcpClient.getPriorities() as Promise<PriorityConfig[]>,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/mcp/config/categories'],
    queryFn: () => mcpClient.getCategories() as Promise<TicketCategory[]>,
  });

  const { data: allOrganizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['/mcp/organizations'],
    queryFn: () => mcpClient.getAllOrganizations() as Promise<OrganizationListItem[]>,
  });

  const priorityForm = useForm<PriorityFormData>({
    resolver: zodResolver(prioritySchema),
    defaultValues: {
      name: "",
      level: 1,
      color: "#ef4444",
      basePoints: 25,
      responseTimeMinutes: 60,
      resolutionTimeMinutes: 480,
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      bonusPoints: 0,
    },
  });

  const createPriorityMutation = useMutation({
    mutationFn: (data: PriorityFormData) => mcpClient.createPriority(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/config/priorities'] });
      toast({ title: "Priority created" });
      setPriorityDialogOpen(false);
      priorityForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create priority", description: error.message, variant: "destructive" });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PriorityFormData> }) => 
      mcpClient.updatePriority(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/config/priorities'] });
      toast({ title: "Priority updated" });
      setPriorityDialogOpen(false);
      setEditingPriority(null);
      priorityForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update priority", description: error.message, variant: "destructive" });
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: (id: string) => mcpClient.deletePriority(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/config/priorities'] });
      toast({ title: "Priority deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete priority", description: error.message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => mcpClient.createCategory({ 
      name: data.name, 
      description: data.description,
      icon: data.icon,
      isActive: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/config/categories'] });
      toast({ title: "Category created" });
      setCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create category", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => 
      mcpClient.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/config/categories'] });
      toast({ title: "Category updated" });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update category", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => mcpClient.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/config/categories'] });
      toast({ title: "Category deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete category", description: error.message, variant: "destructive" });
    },
  });

  const copyOrgCode = () => {
    if (organization?.slug) {
      navigator.clipboard.writeText(organization.slug);
      setCopied(true);
      toast({ title: "Copied", description: "Organization code copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEditPriority = (priority: PriorityConfig) => {
    setEditingPriority(priority);
    priorityForm.reset({
      name: priority.name,
      level: priority.level,
      color: priority.color,
      basePoints: priority.basePoints,
      responseTimeMinutes: priority.responseTimeMinutes,
      resolutionTimeMinutes: priority.resolutionTimeMinutes,
    });
    setPriorityDialogOpen(true);
  };

  const openEditCategory = (category: TicketCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      bonusPoints: category.bonusPoints || 0,
    });
    setCategoryDialogOpen(true);
  };

  const onPrioritySubmit = (data: PriorityFormData) => {
    if (editingPriority) {
      updatePriorityMutation.mutate({ id: editingPriority.id, data });
    } else {
      createPriorityMutation.mutate(data);
    }
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  if (orgLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6" data-testid="page-settings">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6 max-w-4xl mx-auto" data-testid="page-settings">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Organization</h3>
            <p className="text-muted-foreground">
              Please set up or join an organization to configure ITSM settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-full space-y-6" data-testid="page-settings">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your organization configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization
          </CardTitle>
          <CardDescription>Your organization details and invite code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={organization.name} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input value={organization.domain || "Not set"} readOnly className="bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Organization Code (Share with team members)</Label>
            <div className="flex gap-2">
              <Input value={organization.slug} readOnly className="bg-muted font-mono" data-testid="input-org-code" />
              <Button variant="outline" size="icon" onClick={copyOrgCode} data-testid="button-copy-code">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Priorities & Points
              </CardTitle>
              <CardDescription>Configure ticket priorities and point rewards</CardDescription>
            </div>
            <Dialog open={priorityDialogOpen} onOpenChange={(open) => {
              setPriorityDialogOpen(open);
              if (!open) {
                setEditingPriority(null);
                priorityForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-priority">
                  <Plus className="w-4 h-4 mr-1" /> Add Priority
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPriority ? "Edit Priority" : "Add Priority"}</DialogTitle>
                  <DialogDescription>Configure priority level and point rewards</DialogDescription>
                </DialogHeader>
                <Form {...priorityForm}>
                  <form onSubmit={priorityForm.handleSubmit(onPrioritySubmit)} className="space-y-4">
                    <FormField control={priorityForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input placeholder="Critical" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={priorityForm.control} name="level" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level (1-10)</FormLabel>
                          <FormControl><Input type="number" min={1} max={10} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={priorityForm.control} name="color" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={priorityForm.control} name="basePoints" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points for Resolving</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={priorityForm.control} name="responseTimeMinutes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Response Time (min)</FormLabel>
                          <FormControl><Input type="number" min={1} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={priorityForm.control} name="resolutionTimeMinutes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resolution Time (min)</FormLabel>
                          <FormControl><Input type="number" min={1} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full" disabled={createPriorityMutation.isPending || updatePriorityMutation.isPending}>
                      {(createPriorityMutation.isPending || updatePriorityMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingPriority ? "Update Priority" : "Create Priority"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {prioritiesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : priorities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No priorities configured. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {priorities.map((priority) => (
                <div key={priority.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`priority-${priority.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: priority.color }} />
                    <div>
                      <p className="font-medium">{priority.name}</p>
                      <p className="text-sm text-muted-foreground">Level {priority.level} • Response: {formatTime(priority.responseTimeMinutes)} • Resolution: {formatTime(priority.resolutionTimeMinutes)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-0">
                      <Coins className="w-3 h-3 mr-1" />{priority.basePoints} pts
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditPriority(priority)} data-testid={`button-edit-priority-${priority.id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePriorityMutation.mutate(priority.id)} data-testid={`button-delete-priority-${priority.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Ticket Categories
              </CardTitle>
              <CardDescription>Types of tickets your organization handles</CardDescription>
            </div>
            <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
              setCategoryDialogOpen(open);
              if (!open) {
                setEditingCategory(null);
                categoryForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-category">
                  <Plus className="w-4 h-4 mr-1" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                  <DialogDescription>Configure ticket category details</DialogDescription>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                    <FormField control={categoryForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input placeholder="Hardware" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={categoryForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Input placeholder="Physical equipment issues" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={categoryForm.control} name="icon" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (optional)</FormLabel>
                        <FormControl><Input placeholder="cpu" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                      {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingCategory ? "Update Category" : "Create Category"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No categories configured</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`category-${category.id}`}>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.isActive ? "default" : "secondary"}>{category.isActive ? "Active" : "Inactive"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditCategory(category)} data-testid={`button-edit-category-${category.id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategoryMutation.mutate(category.id)} data-testid={`button-delete-category-${category.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            All Organizations
          </CardTitle>
          <CardDescription>View all organizations in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {orgsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : allOrganizations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No organizations found</p>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {allOrganizations.map((org) => (
                  <div key={org.id} className={`flex items-center gap-3 p-3 rounded-lg border ${org.id === organization?.id ? 'border-primary bg-primary/5' : ''}`} data-testid={`org-item-${org.id}`}>
                    <Avatar className="h-10 w-10">
                      {org.logoUrl ? <AvatarImage src={org.logoUrl} alt={org.name} /> : null}
                      <AvatarFallback className="bg-primary/20 text-primary">{org.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{org.name}</p>
                        {org.id === organization?.id && <Badge variant="secondary" className="text-xs">Current</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">Code: {org.slug}{org.domain && ` • ${org.domain}`}</p>
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
