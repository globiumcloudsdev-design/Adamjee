"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ClassSelect from "@/components/ui/class-select";
import {
  MessageSquare,
  Phone,
  Send,
  Users,
  Search,
  Clock,
  CheckCheck,
  Plus,
  X,
} from "lucide-react";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";

export default function ParentContactPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    loadClasses();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const { mockClasses } = await import("@/data/teacher");
      await new Promise((resolve) => setTimeout(resolve, 600));
      setClasses(mockClasses);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForClass = async (classId) => {
    const classData = classes.find((c) => c._id === classId);
    if (classData && classData.students) {
      setStudents(classData.students);
    } else {
      setStudents([]);
    }
  };

  const loadConversations = () => {
    // Sample conversations (in production, load from backend)
    setConversations([
      {
        id: 1,
        studentId: 1,
        studentName: "Zara Khalid",
        studentAvatar: "ZK",
        parentName: "Khalid Mahmood",
        parentPhone: "+92 360 1234560",
        lastMessage: "Thank you for the update!",
        timestamp: new Date().toISOString(),
        unread: 2,
        messages: [
          {
            id: 1,
            from: "teacher",
            text: "Hello! I wanted to discuss Zara's performance.",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: true,
          },
          {
            id: 2,
            from: "parent",
            text: "Thank you for reaching out. How is she doing?",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            read: true,
          },
          {
            id: 3,
            from: "teacher",
            text: "She has shown excellent improvement in Mathematics!",
            timestamp: new Date(Date.now() - 900000).toISOString(),
            read: true,
          },
          {
            id: 4,
            from: "parent",
            text: "Thank you for the update!",
            timestamp: new Date().toISOString(),
            read: false,
          },
        ],
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedConversation) return;

    const newMessage = {
      id: selectedConversation.messages.length + 1,
      from: "teacher",
      text: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: message.trim(),
              timestamp: new Date().toISOString(),
            }
          : conv
      )
    );

    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
    });

    setMessage("");
  };

  const handleStartNewConversation = (student) => {
    const existingConv = conversations.find((c) => c.studentId === student.id);

    if (existingConv) {
      setSelectedConversation(existingConv);
      setShowNewMessage(false);
      return;
    }

    const newConv = {
      id: conversations.length + 1,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      parentName: student.parentName || "Parent",
      parentPhone: student.parentPhone || student.phone,
      lastMessage: "",
      timestamp: new Date().toISOString(),
      unread: 0,
      messages: [],
    };

    setConversations([newConv, ...conversations]);
    setSelectedConversation(newConv);
    setShowNewMessage(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col p-6 bg-gradient-to-br from-muted/30 to-background">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Parent Contact</h1>
        <p className="text-muted-foreground">
          Professional messaging system for parent communication
        </p>
      </div>

      {/* Main Messaging Area */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Left Sidebar - Conversations List */}
        <Card className="w-full md:w-96 flex flex-col overflow-hidden border-2 shadow-lg">
          {/* Header */}
          <div className="p-5 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Messages
              </h2>
              <Button
                onClick={() => setShowNewMessage(true)}
                size="sm"
                className="rounded-full w-10 h-10 p-0 shadow-md hover:shadow-lg transition-shadow"
                title="New Message"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm bg-background"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-2">Click + to start messaging</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-all ${
                      selectedConversation?.id === conv.id
                        ? "bg-primary/10 border-l-4 border-primary"
                        : ""
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold shrink-0 shadow-md">
                        {conv.studentAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {conv.studentName}
                          </h4>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(conv.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                          {conv.parentName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center p-0 text-[10px] font-bold">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Right Side - Chat Area */}
        {selectedConversation ? (
          <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-lg">
            {/* Chat Header */}
            <div className="p-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold shadow-md">
                    {selectedConversation.studentAvatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {selectedConversation.studentName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium">
                        {selectedConversation.parentName}
                      </span>
                      <span>•</span>
                      <Phone className="w-3 h-3" />
                      <span>{selectedConversation.parentPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-muted/20 to-background">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-20 h-20 mx-auto mb-4 opacity-40" />
                    <p className="text-base font-medium">No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation below</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {selectedConversation.messages.map((msg, index) => (
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
                        className={`max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm ${
                          msg.from === "teacher"
                            ? "bg-gradient-to-r from-primary to-primary/90 text-white rounded-br-sm"
                            : "bg-white border-2 border-border text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div
                          className={`flex items-center gap-2 mt-2.5 text-xs ${
                            msg.from === "teacher"
                              ? "text-white/70 justify-end"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(msg.timestamp)}</span>
                          {msg.from === "teacher" && (
                            <CheckCheck
                              className={`w-4 h-4 ${
                                msg.read ? "text-blue-200" : "text-white/50"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message... (Press Enter to send)"
                  className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="h-full px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-1">
                💡 Tip: Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center overflow-hidden border-2 shadow-lg bg-gradient-to-br from-muted/30 to-background">
            <div className="text-center text-muted-foreground px-8">
              <MessageSquare className="w-24 h-24 mx-auto mb-5 opacity-40" />
              <h3 className="text-xl font-semibold mb-3">
                Select a conversation
              </h3>
              <p className="text-sm">
                Choose a contact from the left or start a new message
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* New Message Modal */}
      <AnimatePresence>
        {showNewMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewMessage(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold">New Message</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewMessage(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                <ClassSelect
                  id="new-msg-class"
                  name="class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  classes={classes}
                  placeholder="Select a class..."
                  className="w-full mb-6"
                />

                {students.length > 0 && (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      Select a parent to message:
                    </p>
                    {students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleStartNewConversation(student)}
                        className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-all hover:border-primary text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                            {student.avatar}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Parent: {student.parentName || "Parent"} •{" "}
                              {student.parentPhone || student.phone}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
