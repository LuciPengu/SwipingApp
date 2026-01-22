import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Coins, Trophy, Clock, CheckCircle2, Target } from "lucide-react";
import type { AgentStats as AgentStatsType } from "@shared/schema";

interface AgentStatsProps {
  stats: AgentStatsType;
  isLoading?: boolean;
}

export function AgentStats({ stats, isLoading }: AgentStatsProps) {
  const dailyGoal = 10;
  const progress = Math.min((stats.ticketsResolved / dailyGoal) * 100, 100);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-secondary rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-secondary rounded-lg" />
          <div className="h-20 bg-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="container-agent-stats">
      {/* Streak Card */}
      <Card className={`relative overflow-hidden ${stats.streak > 0 ? 'border-orange-500/30' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
              <div className="flex items-center gap-2">
                <Flame className={`w-8 h-8 ${stats.streak > 0 ? 'text-orange-500 animate-pulse-fire' : 'text-muted-foreground'}`} />
                <span className="text-4xl font-bold" data-testid="text-streak-count">
                  {stats.streak}
                </span>
              </div>
            </div>
            {stats.streak >= 5 && (
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-0">
                On Fire!
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.streak > 0 
              ? `${stats.streak} tickets resolved within SLA` 
              : "Resolve tickets within SLA to build your streak"}
          </p>
        </CardContent>
      </Card>

      {/* Daily Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Daily Goal</span>
            </div>
            <span className="text-sm text-muted-foreground" data-testid="text-daily-progress">
              {stats.ticketsResolved}/{dailyGoal}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress >= 100 && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Daily goal achieved!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Coins className="w-6 h-6 text-yellow-500 mb-2" />
            <span className="text-2xl font-bold" data-testid="text-coins-count">
              {stats.coins}
            </span>
            <span className="text-xs text-muted-foreground">Coins Earned</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Trophy className="w-6 h-6 text-primary mb-2" />
            <span className="text-2xl font-bold" data-testid="text-rank">
              #{stats.rank}
            </span>
            <span className="text-xs text-muted-foreground">Leaderboard</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
            <span className="text-2xl font-bold" data-testid="text-resolved-count">
              {stats.ticketsResolved}
            </span>
            <span className="text-xs text-muted-foreground">Resolved</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-blue-500 mb-2" />
            <span className="text-2xl font-bold" data-testid="text-avg-time">
              {stats.avgResponseTime}
            </span>
            <span className="text-xs text-muted-foreground">Avg Response</span>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Tickets */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tickets Assigned</span>
            <Badge variant="secondary" data-testid="text-assigned-count">
              {stats.ticketsAssigned}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
