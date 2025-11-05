import React from 'react';
import VoiceChatInterface from '@/components/VoiceChatInterface';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CuizlyAssistantSidebar } from "@/components/CuizlyAssistantSidebar";

const VoiceChat = () => {
  return (
    <SidebarProvider defaultOpen={true} collapsedWidth={56}>
      <div className="flex min-h-screen w-full">
        <CuizlyAssistantSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header avec trigger pour mobile */}
          <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <img 
                src="/cuizly-assistant-logo.png" 
                alt="Cuizly Assistant" 
                className="h-8 w-8 rounded-lg md:hidden"
              />
              <h1 className="text-lg font-semibold">Cuizly Assistant</h1>
            </div>
          </header>

          {/* Contenu principal */}
          <main className="flex-1">
            <VoiceChatInterface />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default VoiceChat;