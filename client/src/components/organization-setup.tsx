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
import { Building2, Users, Loader2 } from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
    mutationFn: (data: CreateOrgFormData) => mcpClient.createOrganization({
      name: data.name,
      domain: data.domain || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/organizations/my'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/profiles/me'] });
      toast({
        title: "Organization created",
        description: "Your organization has been set up with default ITSM configuration.",
      });
      onComplete();
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
      queryClient.invalidateQueries({ queryKey: ['/mcp/organizations/my'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/profiles/me'] });
      toast({
        title: "Joined organization",
        description: "You have successfully joined the organization.",
      });
      onComplete();
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
