import { useState, useRef, useEffect } from "react";
import { Send, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

const TypingIndicator = () => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-chat-assistant-bubble flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-chat-assistant-text/70">AI</span>
    </div>
    <div className="bg-chat-assistant-bubble rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center gap-1.5">
        <div className="typing-dot w-2 h-2 rounded-full" />
        <div className="typing-dot w-2 h-2 rounded-full" />
        <div className="typing-dot w-2 h-2 rounded-full" />
      </div>
    </div>
  </div>
);

const ChatArea = ({ messages, isLoading, onSendMessage }: ChatAreaProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col bg-chat-bg min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">AI</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Start a conversation by typing a message below.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 mb-4 ${msg.role === "user" ? "flex-row-reverse" : ""
                }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === "user"
                  ? "bg-chat-user-bubble text-chat-user-text"
                  : "bg-chat-assistant-bubble text-chat-assistant-text/70"
                  }`}
              >
                {msg.role === "user" ? <UserIcon className="h-4 w-4" /> : "AI"}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-chat-user-bubble text-chat-user-text rounded-2xl rounded-tr-sm"
                  : "bg-chat-assistant-bubble text-chat-assistant-text rounded-2xl rounded-tl-sm prose prose-sm prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-bold prose-ul:my-1 prose-li:my-0.5 max-w-none"
                  }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="shrink-0 border-t border-border bg-chat-bg px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
