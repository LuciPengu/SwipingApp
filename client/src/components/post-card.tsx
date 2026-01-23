import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ChevronUp,
  Megaphone
} from "lucide-react";
import type { Post } from "@shared/schema";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onSkip: (postId: string) => void;
  isActive?: boolean;
  currentIndex?: number;
  totalCount?: number;
  canSkip?: boolean;
}

export function PostCard({ 
  post, 
  onLike,
  onComment,
  onSkip,
  isActive = true,
  currentIndex = 0,
  totalCount = 1,
  canSkip = true
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  
  const skipOpacity = useTransform(y, [0, -50, -100], [0, 0.5, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    const velocityThreshold = 500;
    
    if (canSkip && (info.velocity.y < -velocityThreshold || info.offset.y < -threshold)) {
      setSwipeDirection("up");
      setTimeout(() => onSkip(post.id), 300);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      setIsLiked(true);
      onLike(post.id);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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

  return (
    <motion.div
      className={`relative w-full h-full rounded-lg overflow-hidden bg-card ${
        swipeDirection === "up" ? "animate-swipe-up" : ""
      }`}
      style={{ x, y, rotate, opacity: cardOpacity }}
      drag={isActive}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onDoubleClick={handleDoubleTap}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary to-background">
        {post.imageUrl ? (
          <img 
            src={post.imageUrl} 
            alt="Post image"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Megaphone className="w-32 h-32 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 feed-gradient" />

      {/* Skip Indicator */}
      {canSkip && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          style={{ opacity: skipOpacity }}
        >
          <div className="bg-blue-500/90 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
            <ChevronUp className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">SKIP</span>
          </div>
        </motion.div>
      )}

      {/* Progress Indicator */}
      {totalCount > 1 && (
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {Array.from({ length: totalCount }).map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx === currentIndex 
                  ? 'bg-white' 
                  : idx < currentIndex 
                    ? 'bg-white/50' 
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      )}

      {/* Top Bar - Post Badge */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-5 flex items-center justify-between z-10">
        <Badge 
          variant="secondary" 
          className="bg-primary/80 text-primary-foreground border-0"
          data-testid={`badge-post-${post.id}`}
        >
          <Megaphone className="w-3 h-3 mr-1" />
          POST
        </Badge>
        
        <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-0 text-white">
          {formatTimeAgo(post.createdAt)}
        </Badge>
      </div>

      {/* Right Side Action Buttons */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3 z-10">
        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className={`w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white ${isLiked ? 'text-red-500' : ''}`}
            onClick={() => {
              setIsLiked(!isLiked);
              onLike(post.id);
            }}
            data-testid={`button-like-${post.id}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">{post.likesCount + (isLiked ? 1 : 0)}</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white"
            onClick={() => onComment(post.id)}
            data-testid={`button-comment-${post.id}`}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">{post.commentsCount}</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white"
            data-testid={`button-share-${post.id}`}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">Share</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-20 p-4 z-10">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-primary">
            <AvatarImage src={post.userAvatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(post.userName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-white text-sm" data-testid={`text-author-${post.id}`}>
              @{post.userName.toLowerCase().replace(/[@\s]/g, '_').split('_')[0]}
            </p>
          </div>
        </div>

        {/* Post Title & Content */}
        {post.title && (
          <h3 className="text-white text-lg font-bold mb-1" data-testid={`text-title-${post.id}`}>
            {post.title}
          </h3>
        )}
        <p className="text-white text-base leading-relaxed line-clamp-4" data-testid={`text-content-${post.id}`}>
          {post.content}
        </p>
      </div>
    </motion.div>
  );
}
