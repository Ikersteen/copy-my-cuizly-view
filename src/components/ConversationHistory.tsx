import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Mic, 
  Trash2, 
  Edit, 
  Calendar,
  Search,
  Archive
} from 'lucide-react';
import { useConversations, type Conversation } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (conversation: Conversation) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  isOpen,
  onClose,
  onSelectConversation
}) => {
  const { 
    conversations, 
    loading, 
    deleteConversation, 
    updateConversationTitle 
  } = useConversations();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(conv.created_at).toLocaleDateString('fr-FR').includes(searchTerm)
  );

  const handleEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || '');
  };

  const handleSaveEdit = async (conversationId: string) => {
    if (editTitle.trim()) {
      await updateConversationTitle(conversationId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (conversationId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      await deleteConversation(conversationId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Historique des conversations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('placeholders.searchConversation')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation sauvegardée'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {editingId === conversation.id ? (
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(conversation.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              className="text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(conversation.id)}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <h3 
                            className="font-medium text-sm mb-2 cursor-pointer hover:text-primary"
                            onClick={() => onSelectConversation?.(conversation)}
                          >
                            {conversation.title || `Conversation du ${new Date(conversation.created_at).toLocaleDateString('fr-FR')}`}
                          </h3>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(conversation.created_at), { 
                              addSuffix: true,
                              locale: fr 
                            })}
                          </div>
                          <Badge variant={conversation.type === 'voice' ? 'default' : 'secondary'} className="text-xs">
                            {conversation.type === 'voice' ? (
                              <><Mic className="w-3 h-3 mr-1" /> Vocal</>
                            ) : (
                              <><MessageSquare className="w-3 h-3 mr-1" /> Texte</>
                            )}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(conversation)}
                          disabled={editingId !== null}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(conversation.id)}
                          disabled={editingId !== null}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
            <span>{filteredConversations.length} conversation(s)</span>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationHistory;