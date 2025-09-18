import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Heart, HeartCrack, Bookmark, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MessageActionsProps {
  messageId: string;
  content: string;
  isLiked?: boolean;
  isDisliked?: boolean;
  isBookmarked?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onBookmark?: () => void;
  className?: string;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  content,
  isLiked = false,
  isDisliked = false,
  isBookmarked = false,
  onLike,
  onDislike,
  onBookmark,
  className
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLike}
        className={cn(
          "h-7 w-7 p-0",
          isLiked && "text-red-500 hover:text-red-600"
        )}
        title={t('messageActions.like')}
      >
        <Heart className={cn("w-3 h-3", isLiked && "fill-current")} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onDislike}
        className={cn(
          "h-7 w-7 p-0",
          isDisliked && "text-gray-600 hover:text-gray-700"
        )}
        title={t('messageActions.dislike')}
      >
        <HeartCrack className={cn("w-3 h-3", isDisliked && "fill-current")} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onBookmark}
        className={cn(
          "h-7 w-7 p-0",
          isBookmarked && "text-yellow-500 hover:text-yellow-600"
        )}
        title={t('messageActions.bookmark')}
      >
        <Bookmark className={cn("w-3 h-3", isBookmarked && "fill-current")} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 w-7 p-0"
        title={t('messageActions.copy')}
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
};