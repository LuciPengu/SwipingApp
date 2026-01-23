import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, Building2, ChevronRight } from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import type { Profile } from "@shared/schema";

export default function Team() {
  const { data: profiles, isLoading } = useQuery<Profile[]>({
    queryKey: ['/mcp/profiles'],
    queryFn: () => mcpClient.getProfiles() as Promise<Profile[]>,
  });

  const getInitials = (name: string) => {
    return name.split(/[\s@]/).map(n => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="page-team">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Team</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full" data-testid="page-team">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            {profiles?.length || 0} team members
          </p>
        </div>
      </div>

      {profiles?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No team members yet</h3>
            <p className="text-muted-foreground">
              Team members will appear here once they sign up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles?.map((profile) => (
            <Link key={profile.id} href={`/profile/${profile.userId}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-profile-${profile.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary">
                      <AvatarImage src={profile.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(profile.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg truncate" data-testid={`text-name-${profile.id}`}>
                          {profile.displayName}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <Badge variant="secondary" className="mb-2">
                        {profile.role}
                      </Badge>
                      
                      {profile.department && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Building2 className="w-4 h-4" />
                          <span>{profile.department}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                      
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
