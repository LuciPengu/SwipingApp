import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Mail, 
  Building2, 
  Heart, 
  MessageCircle,
  Calendar
} from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import type { Profile, Post } from "@shared/schema";

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/mcp/profiles', userId],
    queryFn: async () => {
      const result = await mcpClient.getProfile(userId!);
      return result as Profile;
    },
    enabled: !!userId,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['/mcp/posts', userId],
    queryFn: async () => {
      const result = await mcpClient.getPosts(userId!);
      return result as Post[];
    },
    enabled: !!userId,
  });

  const getInitials = (name: string) => {
    return name.split(/[\s@]/).map(n => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      <div className="p-6 max-w-2xl mx-auto" data-testid="page-profile">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center" data-testid="page-profile">
        <h2 className="text-xl font-bold mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-4">This user doesn't exist or hasn't set up their profile yet.</p>
        <Link href="/team">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Team
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto overflow-y-auto h-full" data-testid="page-profile">
      {/* Back Button */}
      <Link href="/team">
        <Button variant="ghost" className="mb-4" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Team
        </Button>
      </Link>

      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="w-24 h-24 border-4 border-primary">
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
            {getInitials(profile.displayName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1" data-testid="text-profile-name">
            {profile.displayName}
          </h1>
          <Badge variant="secondary" className="mb-3">
            {profile.role}
          </Badge>
          
          {profile.department && (
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="w-4 h-4" />
              <span>{profile.department}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Mail className="w-4 h-4" />
            <span>{profile.email}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatDate(profile.createdAt)}</span>
          </div>
          
          {profile.bio && (
            <p className="mt-4 text-foreground/80">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">
          Posts ({userPosts.length})
        </h2>
        
        {userPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No posts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <Card key={post.id} data-testid={`card-post-${post.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.userAvatar || undefined} />
                      <AvatarFallback>
                        {getInitials(post.userName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {post.userName.split("@")[0]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                      
                      {post.title && (
                        <h4 className="font-semibold mb-1">{post.title}</h4>
                      )}
                      <p className="text-foreground/90 whitespace-pre-wrap mb-3">
                        {post.content}
                      </p>
                      
                      {post.imageUrl && (
                        <img 
                          src={post.imageUrl} 
                          alt="Post image"
                          className="rounded-lg max-h-64 object-cover mb-3"
                        />
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likesCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentsCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
