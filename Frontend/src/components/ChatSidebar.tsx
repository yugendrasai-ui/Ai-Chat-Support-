import { MessageSquarePlus, MessageSquare } from "lucide-react";

interface Session {
  id: string;
  title?: string;
}

interface ChatSidebarProps {
  sessions: Session[];
  activeSessionId: string;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
}

const ChatSidebar = ({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
}: ChatSidebarProps) => {
  return (
    <aside className="w-64 shrink-0 bg-app-sidebar-bg flex flex-col h-screen border-r border-app-sidebar-border">
      {/* Brand Title */}
      <div className="p-6 pb-2">
        <h1 className="text-xl font-bold text-app-sidebar-fg-bright flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          AI Assistant
        </h1>
        <p className="text-xs text-app-sidebar-fg/60 mt-1">AI Support Assistant</p>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-app-sidebar-hover text-app-sidebar-fg-bright hover:bg-app-sidebar-active transition-colors text-sm font-medium"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto sidebar-scrollbar px-2 pb-4">
        <p className="px-3 py-2 text-xs uppercase tracking-wider text-app-sidebar-fg/60 font-medium">
          History
        </p>
        {sessions.length === 0 && (
          <p className="px-3 py-2 text-xs text-app-sidebar-fg/40">
            No conversations yet
          </p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 text-sm truncate transition-colors flex items-center gap-2 ${session.id === activeSessionId
                ? "bg-app-sidebar-active text-app-sidebar-fg-bright"
                : "text-app-sidebar-fg hover:bg-app-sidebar-hover hover:text-app-sidebar-fg-bright"
              }`}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {session.title || session.id.slice(0, 8) + "..."}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
