import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Upload,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpload } from "@/hooks/use-upload";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  videoUrl?: string;
  category: string;
  authorName: string;
  authorAvatar?: string;
  views: number;
  likes: number;
  duration: string;
  coinsEarned: number;
  createdAt?: string;
}

const videoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

type VideoFormData = z.infer<typeof videoSchema>;

export default function Knowledge() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: videos = [], isLoading } = useQuery<KnowledgeVideo[]>({
    queryKey: ['/mcp/knowledge/videos'],
    queryFn: () => mcpClient.getKnowledgeVideos() as Promise<KnowledgeVideo[]>,
  });

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
    },
  });

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setUploadedVideoPath(response.objectPath);
      toast({
        title: "Video uploaded",
        description: "Your video has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData & { videoUrl: string }) => {
      return mcpClient.createKnowledgeVideo({
        title: data.title,
        description: data.description,
        category: data.category,
        videoUrl: data.videoUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/knowledge/videos'] });
      toast({
        title: "Video created",
        description: "Your knowledge video has been added.",
      });
      setDialogOpen(false);
      form.reset();
      setUploadedVideoPath(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create video",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file.",
          variant: "destructive",
        });
        return;
      }
      await uploadFile(file);
    }
  };

  const onSubmit = (data: VideoFormData) => {
    if (!uploadedVideoPath) {
      toast({
        title: "No video uploaded",
        description: "Please upload a video first.",
        variant: "destructive",
      });
      return;
    }
    createVideoMutation.mutate({ ...data, videoUrl: uploadedVideoPath });
  };

  const filteredVideos = videos.filter(
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-video">
              <Plus className="w-4 h-4 mr-2" />
              Create Video
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Knowledge Video</DialogTitle>
              <DialogDescription>
                Upload a solution video to help your team.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="How to fix printer issues" {...field} data-testid="input-video-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A step-by-step guide to troubleshooting common printer problems..."
                          {...field}
                          data-testid="input-video-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-video-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="access">Access</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video File</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {uploadedVideoPath ? (
                      <div className="text-green-500 flex items-center justify-center gap-2">
                        <PlayCircle className="w-5 h-5" />
                        <span>Video uploaded successfully</span>
                      </div>
                    ) : isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Uploading... {progress}%</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload video</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleFileChange}
                          data-testid="input-video-file"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createVideoMutation.isPending || !uploadedVideoPath}
                  data-testid="button-submit-video"
                >
                  {createVideoMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Add Video"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

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

      <ScrollArea className="h-[calc(100vh-280px)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PlayCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Be the first to share a solution video with the team.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const CategoryIcon = categoryIcons[video.category as keyof typeof categoryIcons] || HelpCircle;

            return (
              <Card key={video.id} className="overflow-visible" data-testid={`card-video-${video.id}`}>
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
                  
                  <button 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                    data-testid={`button-play-${video.id}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </button>

                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-2 right-2 bg-black/70 border-0"
                  >
                    {video.duration}
                  </Badge>

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
        )}
      </ScrollArea>
    </div>
  );
}
