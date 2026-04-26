"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import {
  Send,
  MessageSquare,
  Phone,
  User,
  X,
  CheckCheck,
  Clock,
} from "lucide-react";

export default function MessageModal({
  isOpen,
  onClose,
  parent,
  student,
  onSendMessage,
}) {
  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState([
    // Sample conversation history
    {
      id: 1,
      from: "teacher",
      message: "Hello! I wanted to discuss your child's recent performance.",
      timestamp: "2025-12-20 10:30 AM",
      status: "read",
    },
    {
      id: 2,
      from: "parent",
      message: "Thank you for reaching out. How is my child doing?",
      timestamp: "2025-12-20 11:15 AM",
      status: "read",
    },
    {
      id: 3,
      from: "teacher",
      message: "Zara has shown excellent improvement in Mathematics this week!",
      timestamp: "2025-12-20 11:20 AM",
      status: "read",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messageHistory.length + 1,
      from: "teacher",
      message: message.trim(),
      timestamp: new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
    };

    setMessageHistory([...messageHistory, newMessage]);
    setMessage("");

    // Call parent callback
    if (onSendMessage) {
      onSendMessage(message.trim());
    }

    // Simulate parent reply after 3 seconds (for demo)
    setTimeout(() => {
      const autoReply = {
        id: messageHistory.length + 2,
        from: "parent",
        message: "Thank you for the update! I appreciate your communication.",
        timestamp: new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read",
      };
      setMessageHistory((prev) => [...prev, autoReply]);
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!parent || !student) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Message to Parent</h3>
            <p className="text-xs text-muted-foreground font-normal">
              Regarding: {student.name}
            </p>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="flex flex-col h-[600px]">
        {/* Parent Info Header */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-purple-900">{parent.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 text-purple-600" />
                <p className="text-sm text-purple-700">{parent.phone}</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
              {student.roll}
            </Badge>
          </div>
        </Card>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-muted/20 rounded-lg border">
          <AnimatePresence>
            {messageHistory.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${
                  msg.from === "teacher" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.from === "teacher"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-white rounded-br-sm"
                      : "bg-white border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <div
                    className={`flex items-center gap-2 mt-2 ${
                      msg.from === "teacher"
                        ? "text-white/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{msg.timestamp}</span>
                    {msg.from === "teacher" && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ml-auto ${
                          msg.status === "read"
                            ? "text-blue-200"
                            : "text-white/50"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messageHistory.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t pt-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send)"
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                💡 Tip: Be professional and specific in your communication
              </p>
            </div>
            <div className="flex flex-col justify-between">
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="h-full min-h-[88px] px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary flex flex-col gap-1"
              >
                <Send className="w-5 h-5" />
                <span className="text-sm font-semibold">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
