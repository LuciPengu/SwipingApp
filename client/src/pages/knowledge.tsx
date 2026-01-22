import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PlayCircle, 
  Search, 
  Eye, 
  ThumbsUp, 
  Clock,
  Cpu,
  Monitor,
  Wifi,
  Key,
  HelpCircle,
  Coins,
  Plus
} from "lucide-react";
import { useState } from "react";

const categoryIcons = {
  hardware: Cpu,
  software: Monitor,
  network: Wifi,
  access: Key,
  other: HelpCircle,
};

interface KnowledgeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  category: string;
  authorName: string;
  authorAvatar?: string;
  views: number;
  likes: number;
  duration: string;
  coinsEarned: number;
}

const mockVideos: KnowledgeVideo[] = [
  {
    id: "1",
    title: "How to Fix VPN Connection Issues",
    description: "Step by step guide to troubleshoot common VPN problems",
    category: "network",
    authorName: "Sarah Tech",
    views: 1250,
    likes: 89,
    duration: "2:34",
    coinsEarned: 125,
  },
  {
    id: "2",
    title: "Quick Fix: Laptop Won't Turn On",
    description: "Common power issues and how to resolve them",
    category: "hardware",
    authorName: "Mike Support",
    views: 890,
    likes: 67,
    duration: "1:45",
    coinsEarned: 89,
  },
  {
    id: "3",
    title: "Setting Up Two-Factor Authentication",
    description: "Complete guide to enabling 2FA on all company apps",
    category: "access",
    authorName: "Alex Security",
    views: 2100,
    likes: 156,
    duration: "3:12",
    coinsEarned: 210,
  },
  {
    id: "4",
    title: "Microsoft Teams Troubleshooting",
    description: "Fix audio, video, and connection issues",
    category: "software",
    authorName: "Jordan Help",
    views: 567,
    likes: 34,
    duration: "4:20",
    coinsEarned: 56,
  },
];

export default function Knowledge() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = mockVideos.filter(
    v => v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="p-6" data-testid="page-knowledge">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">Solution videos from the team</p>
          </div>
        </div>
        <Button data-testid="button-create-video">
          <Plus className="w-4 h-4 mr-2" />
          Create Video
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search solutions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-knowledge"
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button variant="secondary" size="sm" data-testid="button-filter-all">
          All
        </Button>
        {Object.entries(categoryIcons).map(([cat, Icon]) => (
          <Button key={cat} variant="secondary" size="sm" data-testid={`button-filter-${cat}`}>
            <Icon className="w-4 h-4 mr-1" />
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Video Grid */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const CategoryIcon = categoryIcons[video.category as keyof typeof categoryIcons] || HelpCircle;

            return (
              <Card key={video.id} className="overflow-visible" data-testid={`card-video-${video.id}`}>
                {/* Thumbnail */}
                <div className="relative aspect-video bg-secondary">
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CategoryIcon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <button 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                    data-testid={`button-play-${video.id}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </button>

                  {/* Duration */}
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-2 right-2 bg-black/70 border-0"
                  >
                    {video.duration}
                  </Badge>

                  {/* Category */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm border-0"
                  >
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {video.category}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2" data-testid={`text-title-${video.id}`}>
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {video.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={video.authorAvatar} />
                        <AvatarFallback className="text-xs">
                          {getInitials(video.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{video.authorName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatViews(video.views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{video.likes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Creator Fund Earnings */}
                  {video.coinsEarned > 0 && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Creator earnings</span>
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-0">
                        <Coins className="w-3 h-3 mr-1" />
                        {video.coinsEarned}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
