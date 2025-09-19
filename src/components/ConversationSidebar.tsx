import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Menu, Edit3, Trash2, Check, X } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useConversations";
import { useTranslation } from 'react-i18next';

interface ConversationSidebarProps {
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  className?: string;
  isMobile?: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentConversation,
  onSelectConversation,
  onNewConversation,
  className,
  isMobile = false
}) => {
  const { conversations, loading, deleteConversation, updateConversationTitle } = useConversations();
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || `${t('conversations.conversationFrom')} ${new Date(conversation.created_at).toLocaleDateString()}`);
  };

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await updateConversationTitle(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (conversation: Conversation) => {
    if (confirm(t('confirmations.deleteConversation'))) {
      await deleteConversation(conversation.id);
      if (currentConversation?.id === conversation.id) {
        onNewConversation();
      }
    }
  };

  const SidebarContent = () => (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          {t('conversations.newConversation')}
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('emptyStates.loadingConversations')}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('emptyStates.noConversation')}
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative rounded-lg p-3 cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  currentConversation?.id === conversation.id && "bg-muted"
                )}
                onClick={() => !editingId && onSelectConversation(conversation)}
              >
                {editingId === conversation.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveEdit}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                         <h3 className="text-sm font-medium truncate">
                           {conversation.title || `${t('conversations.conversationFrom')} ${new Date(conversation.created_at).toLocaleDateString()}`}
                         </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conversation.updated_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {conversation.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(conversation);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conversation);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return <SidebarContent />;
};