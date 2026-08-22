"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function LiveChatTab() {
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState("");

  const { data: activeChats = [], isLoading } = useQuery({
    queryKey: ["adminSupportChat"],
    queryFn: () => api.get("/admin/support/chat").then((res) => res.data || []),
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>💬</span> Merchant Live Chat Console
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Real-time chat queue where support team communicates directly with logged-in sellers.
          </p>
        </div>
        <span className="px-2.5 py-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[10px] font-black uppercase">
          🟢 Chat Server Online
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Chat List Sidebar */}
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-[#1e293b] bg-[#0b1120]">
            <h3 className="text-xs font-black text-white uppercase tracking-wide">
              Active Chat Queue ({activeChats.length})
            </h3>
          </div>
          <div className="divide-y divide-[#1e293b]/50 overflow-y-auto flex-1">
            {isLoading ? (
              <p className="p-4 text-xs text-slate-400">Loading chat queue...</p>
            ) : (
              activeChats.map((chat) => (
                <div
                  key={chat.chatId}
                  onClick={() => setActiveChat(chat)}
                  className={`p-3.5 hover:bg-[#0c1324] cursor-pointer transition flex items-start justify-between gap-2 ${
                    activeChat?.chatId === chat.chatId ? "bg-indigo-600/10 border-l-2 border-indigo-500" : ""
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>👤</span> {chat.sellerName}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{chat.lastMessage}</p>
                    <span className="text-[9px] text-slate-500 font-mono">{chat.time}</span>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[9px] font-black">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window Console */}
        <div className="lg:col-span-2 border border-[#1e293b] rounded-2xl bg-[#080d1a] flex flex-col overflow-hidden">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-[#1e293b] bg-[#0b1120] flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>💬</span> Chat with {activeChat.sellerName}
                  </h4>
                  <span className="text-[9px] font-mono text-slate-400">Session ID: {activeChat.chatId}</span>
                </div>
                <span className="px-2 py-0.5 border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 rounded text-[9px] font-bold">
                  Agent: {activeChat.assignedAgent}
                </span>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-[#070b16]">
                <div className="flex justify-start">
                  <div className="max-w-[75%] bg-[#0f172a] border border-[#1e293b] text-slate-200 p-3 rounded-2xl text-xs space-y-1">
                    <span className="text-[9px] text-indigo-400 font-bold block">{activeChat.sellerName}</span>
                    <p>{activeChat.lastMessage}</p>
                  </div>
                </div>
              </div>

              {/* Input Box */}
              <div className="p-3 border-t border-[#1e293b] bg-[#0b1120] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type live chat message..."
                  className="flex-1 bg-[#080d1a] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setChatInput("")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2 p-8">
              <span className="text-3xl">💬</span>
              <p className="text-xs font-bold text-slate-400">Select a chat from the queue to start conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
