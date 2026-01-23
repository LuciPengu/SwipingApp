import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  User,
  Mail, 
  Building2,
  FileText,
  Heart,
  MessageCircle
} from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import type { Profile, Post } from "@shared/schema";

export default function MyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/mcp/profiles/me'],
    queryFn: async () => {
      const result = await mcpClient.getMyProfile();
      return result as Profile;
    },
  });

  const { data: myPosts = [] } = useQuery({
    queryKey: ['/mcp/posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await mcpClient.getPosts(user.id);
      return result as Post[];
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { displayName?: string; bio?: string; department?: string }) => {
      return mcpClient.updateMyProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/profiles/me'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/profiles'] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setDisplayName(profile?.displayName || user?.email?.split('@')[0] || "");
    setBio(profile?.bio || "");
    setDepartment(profile?.department || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      displayName: displayName || undefined,
      bio: bio || undefined,
      department: department || undefined,
    });
  };

  const getInitials = (name: string) => {
    return name.split(/[\s@]/).map(n => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (profileLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto" data-testid="page-my-profile">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentName = profile?.displayName || user?.email?.split('@')[0] || 'Agent';

  return (
    <div className="p-6 max-w-2xl mx-auto overflow-y-auto h-full" data-testid="page-my-profile">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          {!isEditing && (
            <Button variant="outline" onClick={handleEdit} data-testid="button-edit-profile">
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="w-20 h-20 border-4 border-primary">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(currentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  <p>Avatar changes coming soon</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  data-testid="input-display-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., IT Support, Engineering"
                  data-testid="input-department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your team about yourself..."
                  rows={3}
                  data-testid="input-bio"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleSave} 
                  disabled={updateMutation.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20 border-4 border-primary">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(currentName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-xl font-semibold" data-testid="text-my-name">
                    {currentName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile?.role || 'Agent'}</p>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>

                {profile?.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{profile.department}</span>
                  </div>
                )}

                {profile?.bio && (
                  <div className="flex items-start gap-2 text-foreground/80">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span>{profile.bio}</span>
                  </div>
                )}

                {!profile?.bio && !profile?.department && (
                  <p className="text-sm text-muted-foreground italic">
                    Click "Edit Profile" to add your department and bio
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Posts ({myPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {myPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              You haven't posted anything yet. Use the "Create Post" button in the sidebar to share with your team!
            </p>
          ) : (
            <div className="space-y-4">
              {myPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="p-4 rounded-lg border bg-card"
                  data-testid={`card-my-post-${post.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>
                  <p className="text-foreground/90 whitespace-pre-wrap mb-3">
                    {post.content}
                  </p>
                  {post.imageUrl && (
                    <img 
                      src={post.imageUrl} 
                      alt="Post image"
                      className="rounded-lg max-h-48 object-cover mb-3"
                    />
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likesCount} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
