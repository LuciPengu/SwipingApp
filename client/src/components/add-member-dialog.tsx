import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddMemberDialogProps {
  trigger?: React.ReactNode;
}

export function AddMemberDialog({ trigger }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("Agent");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: () => mcpClient.createMember({
      email,
      displayName,
      department: department || undefined,
      role,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/profiles'] });
      toast({
        title: "Member added",
        description: `${displayName} has been added to the team.`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setDisplayName("");
    setDepartment("");
    setRole("Agent");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName) {
      toast({
        title: "Missing fields",
        description: "Email and name are required.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-member">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Team Member
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-member-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              placeholder="John Smith"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              data-testid="input-member-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="IT Support"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              data-testid="input-member-department"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-member-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Senior Agent">Senior Agent</SelectItem>
                <SelectItem value="Team Lead">Team Lead</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-member"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
              data-testid="button-submit-member"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
