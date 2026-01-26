import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Clock, 
  Tag,
  Copy,
  Check,
  Users,
  Globe
} from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Organization, SlaPolicy, TicketCategory } from "@shared/schema";

interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  domain?: string;
  createdAt?: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['/mcp/organizations/my'],
    queryFn: () => mcpClient.getMyOrganization() as Promise<Organization | null>,
  });

  const { data: slaPolicies = [], isLoading: slaLoading } = useQuery({
    queryKey: ['/mcp/config/sla-policies'],
    queryFn: () => mcpClient.getSlaPolicies() as Promise<SlaPolicy[]>,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/mcp/config/categories'],
    queryFn: () => mcpClient.getCategories() as Promise<TicketCategory[]>,
  });

  const { data: allOrganizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['/mcp/organizations'],
    queryFn: () => mcpClient.getAllOrganizations() as Promise<OrganizationListItem[]>,
  });

  const copyOrgCode = () => {
    if (organization?.slug) {
      navigator.clipboard.writeText(organization.slug);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Organization code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const priorityColors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
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
              <Skeleton className="h-6 w-1/2" />
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
          <p className="text-muted-foreground">Manage your organization and ITSM configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization
          </CardTitle>
          <CardDescription>
            Your organization details and invite code
          </CardDescription>
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
              <Input 
                value={organization.slug} 
                readOnly 
                className="bg-muted font-mono"
                data-testid="input-org-code"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyOrgCode}
                data-testid="button-copy-code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            SLA Policies
          </CardTitle>
          <CardDescription>
            Response and resolution time targets by priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slaLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : slaPolicies.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No SLA policies configured</p>
          ) : (
            <div className="space-y-3">
              {slaPolicies.map((policy) => (
                <div 
                  key={policy.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`sla-policy-${policy.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${priorityColors[policy.priority] || 'bg-gray-500'}`} />
                    <div>
                      <p className="font-medium">{policy.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{policy.priority} priority</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">Response</p>
                      <p className="font-medium">{formatTime(policy.responseTimeMinutes)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Resolution</p>
                      <p className="font-medium">{formatTime(policy.resolutionTimeMinutes)}</p>
                    </div>
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
            <Tag className="w-5 h-5" />
            Ticket Categories
          </CardTitle>
          <CardDescription>
            Available categories for tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No categories configured</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Badge 
                  key={category.id} 
                  variant={category.isActive ? "default" : "secondary"}
                  className="text-sm py-1 px-3"
                  data-testid={`category-${category.id}`}
                >
                  {category.name}
                </Badge>
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
          <CardDescription>
            View all organizations in the system
          </CardDescription>
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
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {allOrganizations.map((org) => (
                  <div 
                    key={org.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${org.id === organization?.id ? 'border-primary bg-primary/5' : ''}`}
                    data-testid={`org-item-${org.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      {org.logoUrl ? (
                        <AvatarImage src={org.logoUrl} alt={org.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {org.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{org.name}</p>
                        {org.id === organization?.id && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        Code: {org.slug}
                        {org.domain && ` • ${org.domain}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                    </div>
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
