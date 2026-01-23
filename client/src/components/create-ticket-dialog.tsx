import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { mcpClient, CreateTicketData } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CreateTicketDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("other");
  const [assetTag, setAssetTag] = useState("");
  const [assetName, setAssetName] = useState("");
  const [hasBounty, setHasBounty] = useState(false);
  const [bountyAmount, setBountyAmount] = useState(0);

  const createMutation = useMutation({
    mutationFn: (data: CreateTicketData) => mcpClient.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/feed'] });
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted.",
      });
      resetForm();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("other");
    setAssetTag("");
    setAssetName("");
    setHasBounty(false);
    setBountyAmount(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      assetTag: assetTag.trim() || undefined,
      assetName: assetName.trim() || undefined,
      hasBounty,
      bountyAmount: hasBounty ? bountyAmount : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" data-testid="button-create-ticket">
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Submit a new IT support request. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-ticket-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-ticket-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assetTag">Asset Tag (optional)</Label>
                <Input
                  id="assetTag"
                  placeholder="e.g., LAPTOP-001"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  data-testid="input-asset-tag"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assetName">Asset Name (optional)</Label>
                <Input
                  id="assetName"
                  placeholder="e.g., Dell XPS 15"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  data-testid="input-asset-name"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="bounty">Add Bounty</Label>
                <p className="text-sm text-muted-foreground">
                  Offer coins for faster resolution
                </p>
              </div>
              <Switch
                id="bounty"
                checked={hasBounty}
                onCheckedChange={setHasBounty}
                data-testid="switch-bounty"
              />
            </div>
            {hasBounty && (
              <div className="grid gap-2">
                <Label htmlFor="bountyAmount">Bounty Amount (coins)</Label>
                <Input
                  id="bountyAmount"
                  type="number"
                  min={0}
                  value={bountyAmount}
                  onChange={(e) => setBountyAmount(parseInt(e.target.value) || 0)}
                  data-testid="input-bounty-amount"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !description.trim() || createMutation.isPending}
              data-testid="button-submit-ticket"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
