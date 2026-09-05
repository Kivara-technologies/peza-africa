import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function Chat() {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: chats } = trpc.chat.list.useQuery();
  const { data: messages } = trpc.chat.messages.useQuery(
    { chatId: activeChat! },
    { enabled: activeChat !== null }
  );
  const utils = trpc.useUtils();

  const sendMsg = trpc.chat.send.useMutation({
    onSuccess: () => {
      setNewMsg("");
      utils.chat.messages.invalidate({ chatId: activeChat! });
      utils.chat.list.invalidate();
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMsg.trim() || !activeChat) return;
    sendMsg.mutate({ chatId: activeChat, text: newMsg.trim() });
  };

  const activeChatData = chats?.find((c) => c.id === activeChat);

  if (activeChat && activeChatData) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)]">
        {/* Chat Header */}
        <div className="bg-peza-brown px-4 py-3 flex items-center gap-3 rounded-t-xl">
          <button onClick={() => setActiveChat(null)} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-peza-orange flex items-center justify-center text-white font-bold text-sm">
            {activeChatData.avatar}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{activeChatData.name}</p>
            <p className="text-green-400 text-xs">● Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-peza-cream/50 p-4 space-y-3">
          {messages?.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOutgoing ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.isOutgoing ? "bg-peza-orange text-white rounded-br-md" : "bg-white text-peza-brown border border-peza-cream-dark rounded-bl-md"}`}>
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.isOutgoing ? "text-white/60" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-peza-cream-dark p-3 flex items-center gap-2 rounded-b-xl">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border border-peza-cream-dark rounded-full px-4 py-2.5 text-sm outline-none focus:border-peza-orange transition-colors"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 bg-peza-orange rounded-full flex items-center justify-center text-white hover:bg-peza-orange-dark transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-extrabold text-peza-brown mb-4">Messages</h1>
      {chats && chats.length > 0 ? (
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className="w-full bg-white rounded-xl border border-peza-cream-dark p-4 flex items-center gap-3 text-left hover:shadow-peza transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-peza-orange to-red-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {chat.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-peza-brown text-sm">{chat.name}</p>
                  <span className="text-[10px] text-gray-400">
                    {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-peza-brown">No messages yet</h3>
          <p className="text-sm text-gray-500 mt-1">Start a conversation with sellers</p>
        </div>
      )}
    </div>
  );
}
