import { MessageSquare, History, Settings, Home, Sparkles } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { 
    title: "Accueil", 
    url: "/", 
    icon: Home,
    titleEn: "Home"
  },
  { 
    title: "Nouvelle conversation", 
    url: "/voice-chat", 
    icon: Sparkles,
    titleEn: "New Conversation"
  },
]

const conversationItems = [
  { 
    title: "Conversations", 
    url: "/voice-chat", 
    icon: MessageSquare,
    titleEn: "Conversations"
  },
  { 
    title: "Historique", 
    url: "/voice-chat", 
    icon: History,
    titleEn: "History"
  },
]

export function CuizlyAssistantSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-2">
          <img 
            src="/cuizly-assistant-logo.png" 
            alt="Cuizly Assistant" 
            className="h-8 w-8 rounded-lg"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Cuizly Assistant</span>
              <span className="text-xs text-muted-foreground">Assistant vocal IA</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Activité</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
