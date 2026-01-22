import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Flame, Medal, Crown, Star } from "lucide-react";
import type { LeaderboardUser } from "@shared/schema";

export default function Leaderboard() {
  const { data: users, isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard'],
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/30";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const topThree = users?.slice(0, 3) || [];
  const rest = users?.slice(3) || [];

  return (
    <div className="p-6" data-testid="page-leaderboard">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Top performers this week</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 0, 2].map((idx) => {
          const user = topThree[idx];
          if (!user) return <div key={idx} />;

          return (
            <Card 
              key={user.id} 
              className={`relative overflow-visible ${getRankBg(user.rank)} ${idx === 1 ? 'md:-mt-4' : ''}`}
              data-testid={`card-rank-${user.rank}`}
            >
              <CardContent className="p-6 text-center">
                <div className="absolute top-3 left-3">
                  {getRankIcon(user.rank)}
                </div>
                <Avatar className={`w-20 h-20 mx-auto mb-4 ${user.rank === 1 ? 'ring-4 ring-yellow-500/50' : ''}`}>
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg mb-1" data-testid={`text-name-${user.id}`}>{user.displayName}</h3>
                <p className="text-sm text-muted-foreground mb-3" data-testid={`text-username-${user.id}`}>@{user.username}</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <Flame className={`w-4 h-4 ${user.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                    <span className="font-semibold">{user.streak}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{user.ticketsResolved}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {rest.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate"
                  data-testid={`row-rank-${user.rank}`}
                >
                  <span className="w-8 text-center font-bold text-muted-foreground">
                    #{user.rank}
                  </span>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-secondary">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Flame className={`w-4 h-4 ${user.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <span>{user.streak}</span>
                    </div>
                    <Badge variant="secondary">
                      {user.ticketsResolved} resolved
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
