'use client';

import { ModeToggle } from "@/components/ui/modetoggle";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Clipboard } from 'lucide-react'; 

const generateRandomRoomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export default function Home() {
  const wsRef = React.useRef<WebSocket | null>(null);

  const [messages, setMessages] = useState<Array<{ type: "sent" | "received"; message: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [roomId, setRoomId] = useState<string>("");
  const [showRoomPopup, setShowRoomPopup] = useState<boolean>(true);

  useEffect(() => {
    const ws = new WebSocket(window.location.hostname === 'localhost' ? "ws://localhost:4000" : "wss://chatify-k3qg.onrender.com");


    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "received", message: data.payload.message },
        ]);
        toast.success("Message received!");
      } else if (data.type === "messageHistory") {
        setMessages(
          data.payload.messages.map((msg: string) => ({
            type: "received",
            message: msg,
          }))
        );
        // toast.success("Old messages loaded!");
      } else if (data.type === "userList") {
        setUserCount(data.payload.users);
        toast.success("Connected: "+ userCount);
      }
    };

    wsRef.current = ws;

    ws.onopen = () => {
      toast.success("Connected to server!");
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { roomId },
        })
      );
    };

    ws.onerror = () => {
      toast.error("Failed to connect to server!");
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (inputMessage && wsRef.current) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "sent", message: inputMessage },
      ]);
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          payload: { message: inputMessage },
        })
      );
      setInputMessage("");
      toast.success("Message sent!");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateRandomRoomId = () => {
    const randomRoomId = generateRandomRoomId();
    setRoomId(randomRoomId);
    toast.success(`Generated Room ID: ${randomRoomId}`);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied to clipboard!");
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 500) {
        setKeyboardVisible(true);
      } else {
        setKeyboardVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleJoinRoom = () => {
    if (roomId) {
      setShowRoomPopup(false);
      toast.success(`Joined room: ${roomId}`);
    } else {
      toast.error("Room ID cannot be empty!");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col gap-5 justify-center items-center">
    <Toaster position="top-center" />

      <div className="fixed top-5 left-5">
        <Badge>Connected: {userCount}</Badge>
      </div>

      <div className="fixed top-5 right-5">
        <ModeToggle />
      </div>

      {showRoomPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <Card className="w-full max-w-md m-5 p-4">
            <CardHeader>
              <CardTitle>Enter Room ID</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2 justify-center">
                <Input
                  placeholder="Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className=" w-full"
                />
                <Clipboard onClick={handleCopyRoomId} size={24} />
              </div>

              <Button onClick={handleJoinRoom} className="w-full">Join Room</Button>
              <Button onClick={handleGenerateRandomRoomId} className="w-full">Generate Random Room ID</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="h-[95vh] gap-1 flex flex-col justify-end items-end w-full max-w-md overflow-y-auto px-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`px-3 py-2 border w-fit rounded-sm ${message.type === "sent" ? "ml-auto bg-blue-500 text-white" : "mr-auto bg-gray-200 text-black"}`}
          >
            {message.message}
          </div>
        ))}
      </div>

      <div className={`w-full max-w-md px-2 flex gap-2 mb-5 ${keyboardVisible ? "fixed bottom-0" : ""}`}>
        <Input
          id="message"
          placeholder="Write Message"
          className="w-full"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSendMessage}>Send</Button>
      </div>

      {roomId && !showRoomPopup && (
        <div className="fixed top-14 left-5 flex items-center gap-2">
          <Badge className="flex gap-3">Room ID: {roomId} <Clipboard onClick={handleCopyRoomId} size={16} /></Badge>
        </div>
      )}
    </div>
  );
}
