import { Zap } from "lucide-react";

interface ChatHeaderProps {
  sessionId: string;
  tokensUsed: number;
}

const ChatHeader = ({ sessionId, tokensUsed }: ChatHeaderProps) => {
  return (
    <header className="h-14 shrink-0 bg-header-bg border-b border-header-border flex items-center justify-between px-5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Session</span>
        <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono text-foreground/80">
          {sessionId.slice(0, 12)}…
        </code>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{tokensUsed.toLocaleString()}</span>
        <span>tokens</span>
      </div>
    </header>
  );
};

export default ChatHeader;
