import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowUp,
  ChevronUp,
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Monitor,
  Wifi,
  Key,
  HelpCircle,
  Cpu,
  Coins,
  Volume2,
  VolumeX
} from "lucide-react";
import type { FeedTicket } from "@shared/schema";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface TicketCardProps {
  ticket: FeedTicket;
  onAssign: (ticketId: string) => void;
  onResolve: (ticketId: string) => void;
  onEscalate: (ticketId: string) => void;
  onSkip: (ticketId: string) => void;
  onViewActivity: (ticketId: string) => void;
  isActive?: boolean;
  currentIndex?: number;
  totalCount?: number;
  canSkip?: boolean;
}

const categoryIcons = {
  hardware: Cpu,
  software: Monitor,
  network: Wifi,
  access: Key,
  other: HelpCircle,
};

const priorityColors = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const priorityGlow = {
  critical: "priority-critical",
  high: "priority-high",
  medium: "",
  low: "",
};

export function TicketCard({ 
  ticket, 
  onAssign, 
  onResolve, 
  onEscalate, 
  onSkip,
  onViewActivity,
  isActive = true,
  currentIndex = 0,
  totalCount = 1,
  canSkip = true
}: TicketCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  
  const resolveOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  const escalateOpacity = useTransform(x, [0, -50, -100], [0, 0.5, 1]);
  const skipOpacity = useTransform(y, [0, -50, -100], [0, 0.5, 1]);

  const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons] || HelpCircle;
  const priority = ticket.priority as keyof typeof priorityColors;

  const handleDoubleTap = () => {
    if (!isLiked) {
      setIsLiked(true);
      onAssign(ticket.id);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    const velocityThreshold = 500;
    
    if (Math.abs(info.velocity.x) > velocityThreshold || Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        setSwipeDirection("right");
        setTimeout(() => onResolve(ticket.id), 300);
      } else {
        setSwipeDirection("left");
        setTimeout(() => onEscalate(ticket.id), 300);
      }
    } else if (canSkip && (info.velocity.y < -velocityThreshold || info.offset.y < -threshold)) {
      setSwipeDirection("up");
      setTimeout(() => onSkip(ticket.id), 300);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatSlaRemaining = () => {
    if (!ticket.slaDeadline) return null;
    const now = new Date();
    const deadline = new Date(ticket.slaDeadline);
    const diff = deadline.getTime() - now.getTime();
    
    if (diff < 0) return { text: "OVERDUE", urgent: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h`, urgent: false };
    }
    
    return { 
      text: `${hours}h ${minutes}m`, 
      urgent: hours < 2 
    };
  };

  const slaInfo = formatSlaRemaining();

  return (
    <motion.div
      ref={cardRef}
      className={`relative w-full h-full rounded-lg overflow-hidden bg-card ${priorityGlow[priority]} ${
        swipeDirection === "right" ? "animate-swipe-right" :
        swipeDirection === "left" ? "animate-swipe-left" :
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
      {/* Video/Image Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background">
        {ticket.thumbnailUrl ? (
          <img 
            src={ticket.thumbnailUrl} 
            alt={ticket.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CategoryIcon className="w-32 h-32 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 feed-gradient" />

      {/* Swipe Action Indicators */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
        style={{ opacity: resolveOpacity }}
      >
        <div className="bg-green-500/90 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-lg">RESOLVE</span>
        </div>
      </motion.div>

      <motion.div 
        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
        style={{ opacity: escalateOpacity }}
      >
        <div className="bg-orange-500/90 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-lg">ESCALATE</span>
        </div>
      </motion.div>

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

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={`${priorityColors[priority]} text-white border-0`}
            data-testid={`badge-priority-${ticket.id}`}
          >
            {ticket.priority.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-0">
            <CategoryIcon className="w-3 h-3 mr-1" />
            {ticket.category}
          </Badge>
          {ticket.hasBounty && (
            <Badge className="bounty-shimmer text-black border-0" data-testid={`badge-bounty-${ticket.id}`}>
              <Coins className="w-3 h-3 mr-1" />
              {ticket.bountyAmount}
            </Badge>
          )}
        </div>
        
        {slaInfo && (
          <Badge 
            variant="secondary" 
            className={`${slaInfo.urgent ? 'bg-red-500/90 text-white animate-pulse' : 'bg-black/50 backdrop-blur-sm'} border-0`}
            data-testid={`badge-sla-${ticket.id}`}
          >
            <Clock className="w-3 h-3 mr-1" />
            {slaInfo.text}
          </Badge>
        )}
      </div>

      {/* Mute Button */}
      {ticket.videoUrl && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsMuted(!isMuted)}
          data-testid={`button-mute-${ticket.id}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      )}

      {/* Play Button Overlay (for video tickets) */}
      {ticket.videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center z-5">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Right Side Action Buttons */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3 z-10">
        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className={`w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm ${isLiked ? 'text-primary' : ''}`}
            onClick={() => {
              setIsLiked(!isLiked);
              if (!isLiked) onAssign(ticket.id);
            }}
            data-testid={`button-assign-${ticket.id}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">{isLiked ? 'Assigned' : 'Assign'}</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm"
            onClick={() => onViewActivity(ticket.id)}
            data-testid={`button-activity-${ticket.id}`}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">{ticket.activityCount || 0}</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm"
            onClick={() => onResolve(ticket.id)}
            data-testid={`button-resolve-${ticket.id}`}
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">Resolve</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm"
            onClick={() => onEscalate(ticket.id)}
            data-testid={`button-escalate-${ticket.id}`}
          >
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">Escalate</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm"
            data-testid={`button-share-${ticket.id}`}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <span className="text-[10px] text-white/80 mt-0.5">Share</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-20 p-4 z-10">
        {/* Requester Info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-primary">
            <AvatarImage src={ticket.requesterAvatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(ticket.requesterName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-white text-sm" data-testid={`text-requester-${ticket.id}`}>
              @{ticket.requesterName.toLowerCase().replace(/\s/g, '_')}
            </p>
            {ticket.assetName && (
              <p className="text-xs text-white/60">{ticket.assetName}</p>
            )}
          </div>
        </div>

        {/* Ticket Title & Description */}
        <h3 className="font-bold text-white text-lg mb-1 line-clamp-2" data-testid={`text-title-${ticket.id}`}>
          {ticket.title}
        </h3>
        <p className="text-white/80 text-sm line-clamp-2" data-testid={`text-description-${ticket.id}`}>
          {ticket.description}
        </p>

        {/* Asset Tag */}
        {ticket.assetTag && (
          <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
            <Monitor className="w-3 h-3" />
            <span>Asset: {ticket.assetTag}</span>
          </div>
        )}
      </div>

      {/* Swipe Hint Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
        style={{ 
          opacity: useTransform(x, [-100, -50, 0, 50, 100], [1, 0.5, 0, 0.5, 1])
        }}
      >
        {x.get() > 50 && (
          <div className="bg-green-500/80 px-6 py-3 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-white mx-auto" />
            <span className="text-white font-bold">Quick Resolve</span>
          </div>
        )}
        {x.get() < -50 && (
          <div className="bg-orange-500/80 px-6 py-3 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-white mx-auto" />
            <span className="text-white font-bold">Escalate</span>
          </div>
        )}
      </motion.div>

      {/* Skip Hint */}
      <motion.div
        className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none z-20"
        style={{
          opacity: useTransform(y, [-100, -50, 0], [1, 0.5, 0])
        }}
      >
        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <ArrowUp className="w-4 h-4" />
          <span className="text-sm font-medium">Skip</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
