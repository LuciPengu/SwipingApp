import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Building2, Users, Loader2, Copy, Check, PartyPopper } from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@shared/schema";

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  domain: z.string().optional(),
});

const joinOrgSchema = z.object({
  slug: z.string().min(2, "Organization code must be at least 2 characters"),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;
type JoinOrgFormData = z.infer<typeof joinOrgSchema>;

interface OrganizationSetupProps {
  onComplete: () => void;
}

export function OrganizationSetup({ onComplete }: OrganizationSetupProps) {
  const [activeTab, setActiveTab] = useState("create");
  const [createdOrg, setCreatedOrg] = useState<Organization | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyOrgCode = () => {
    if (createdOrg?.slug) {
      navigator.clipboard.writeText(createdOrg.slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createForm = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      domain: "",
    },
  });

  const joinForm = useForm<JoinOrgFormData>({
    resolver: zodResolver(joinOrgSchema),
    defaultValues: {
      slug: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateOrgFormData): Promise<Organization> => {
      const result = await mcpClient.createOrganization({
        name: data.name,
        domain: data.domain || undefined,
      });
      return result as Organization;
    },
    onSuccess: (org: Organization) => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/organizations/my'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/profiles/me'] });
      setCreatedOrg(org);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: (data: JoinOrgFormData) => mcpClient.joinOrganization(data.slug),
    onSuccess: () => {
      toast({
        title: "Joined organization",
        description: "You have successfully joined the organization.",
      });
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: CreateOrgFormData) => {
    createMutation.mutate(data);
  };

  const onJoinSubmit = (data: JoinOrgFormData) => {
    joinMutation.mutate(data);
  };

  if (createdOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <PartyPopper className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Organization Created!</CardTitle>
            <CardDescription>
              Share this code with your team members so they can join.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Organization Name
              </label>
              <p className="text-lg font-semibold">{createdOrg.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Organization Code (Share this with your team)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-muted rounded-md font-mono text-lg font-bold tracking-wider">
                  {createdOrg.slug}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyOrgCode}
                  data-testid="button-copy-org-code"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Team members enter this code when they select "Join Existing" during signup.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => window.location.reload()}
              data-testid="button-continue-to-app"
            >
              Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Organization</CardTitle>
          <CardDescription>
            Create a new organization or join an existing one to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" data-testid="tab-create-org">
                <Building2 className="w-4 h-4 mr-2" />
                Create New
              </TabsTrigger>
              <TabsTrigger value="join" data-testid="tab-join-org">
                <Users className="w-4 h-4 mr-2" />
                Join Existing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-4">
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Corporation"
                            data-testid="input-org-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Domain (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="acme.com"
                            data-testid="input-org-domain"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Users with this email domain can auto-join
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                    data-testid="button-create-org"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4 mr-2" />
                        Create Organization
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="join" className="mt-4">
              <Form {...joinForm}>
                <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-4">
                  <FormField
                    control={joinForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="acme-corporation"
                            data-testid="input-org-code"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Ask your team admin for the organization code
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={joinMutation.isPending}
                    data-testid="button-join-org"
                  >
                    {joinMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Join Organization
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
