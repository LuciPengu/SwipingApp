import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ImagePlus, X, Send, Link2 } from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

interface CreatePostDialogProps {
  children: React.ReactNode;
}

export function CreatePostDialog({ children }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name.split(/[\s@]/).map(n => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  };

  const createPostMutation = useMutation({
    mutationFn: () => mcpClient.createPost({ 
      title: title.trim() || undefined,
      content, 
      imageUrl: imageUrl || imagePreview || undefined 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/feed/mixed'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/posts'] });
      resetForm();
      setOpen(false);
      toast({
        title: "Posted!",
        description: "Your post is now live in the feed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageUrl("");
    setImagePreview(null);
    setShowUrlInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createPostMutation.mutate();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageUrl("");
        setShowUrlInput(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    if (url) {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'You';
  const currentImage = imagePreview || imageUrl;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Create Post
          </DialogTitle>
          <DialogDescription>
            Share updates, tips, or announcements with your team
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title (optional)"
                className="border-0 border-b rounded-none px-0 text-lg font-medium focus-visible:ring-0 focus-visible:border-primary"
                data-testid="input-post-title"
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening? Share something with the team..."
                className="min-h-[100px] resize-none border-0 p-0 text-base focus-visible:ring-0"
                data-testid="textarea-post-content"
              />
            </div>
          </div>

          {currentImage && (
            <Card className="relative overflow-hidden">
              <CardContent className="p-0">
                <img 
                  src={currentImage} 
                  alt="Preview" 
                  className="w-full max-h-64 object-cover"
                  onError={() => {
                    if (imageUrl) {
                      toast({
                        title: "Invalid image",
                        description: "Could not load image from URL.",
                        variant: "destructive",
                      });
                      setImageUrl("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={removeImage}
                  data-testid="button-remove-image"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {showUrlInput && !currentImage && (
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1"
                data-testid="input-image-url"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowUrlInput(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!currentImage}
                data-testid="button-upload-image"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlInput(!showUrlInput)}
                disabled={!!currentImage}
                data-testid="button-add-url"
              >
                <Link2 className="w-4 h-4 mr-2" />
                URL
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-post"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!content.trim() || createPostMutation.isPending}
                className="gap-2"
                data-testid="button-submit-post"
              >
                <Send className="w-4 h-4" />
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
