"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function useSocket(notebookId: string | undefined) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomMembers, setRoomMembers] = useState<Array<{ userId: string; userName: string }>>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!notebookId || !session?.user?.id) return;

    let mounted = true;

    // Fetch socket token and initialize socket
    const initSocket = async () => {
      try {
        const res = await fetch("/api/auth/socket-token");
        if (!res.ok || !mounted) return;
        
        const data = await res.json();
        const socketToken = data.token;

        if (!mounted) return;

        // Create socket connection
        const newSocket = io(SOCKET_URL, {
          auth: {
            token: socketToken,
          },
          transports: ["websocket", "polling"],
        });

        if (!mounted) {
          newSocket.close();
          return;
        }

        socketRef.current = newSocket;
        setSocket(newSocket);

        // Connection events
        newSocket.on("connect", () => {
          console.log("Socket connected");
          if (mounted) {
            setIsConnected(true);
            // Join notebook room
            if (notebookId) {
              newSocket.emit("join-notebook", notebookId);
            }
          }
        });

        newSocket.on("disconnect", () => {
          console.log("Socket disconnected");
          if (mounted) {
            setIsConnected(false);
          }
        });

        newSocket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          if (mounted) {
            setIsConnected(false);
          }
        });

        // Room events
        newSocket.on("user-joined", (data: { userId: string; userName: string }) => {
          console.log("User joined:", data);
          if (mounted) {
            setRoomMembers((prev) => {
              if (prev.find((m) => m.userId === data.userId)) return prev;
              return [...prev, data];
            });
          }
        });

        newSocket.on("user-left", (data: { userId: string; userName: string }) => {
          console.log("User left:", data);
          if (mounted) {
            setRoomMembers((prev) => prev.filter((m) => m.userId !== data.userId));
          }
        });

        newSocket.on("room-members", (members: Array<{ userId: string; userName: string }>) => {
          if (mounted) {
            setRoomMembers(members);
          }
        });
      } catch (err) {
        console.error("Failed to initialize socket:", err);
      }
    };

    initSocket();

    // Cleanup
    return () => {
      mounted = false;
      if (socketRef.current) {
        if (notebookId) {
          socketRef.current.emit("leave-notebook", notebookId);
        }
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [notebookId, session]);

  const emitContentChange = (content: string) => {
    if (socket && notebookId && isConnected) {
      socket.emit("content-change", {
        notebookId,
        content,
        userId: session?.user?.id,
      });
    }
  };

  const emitCursorChange = (cursor: { line: number; ch: number }) => {
    if (socket && notebookId && isConnected) {
      socket.emit("cursor-change", {
        notebookId,
        cursor,
        userId: session?.user?.id,
      });
    }
  };

  const emitVoiceTranscription = (text: string) => {
    if (socket && notebookId && isConnected) {
      socket.emit("voice-transcription", {
        notebookId,
        text,
        userId: session?.user?.id,
      });
    }
  };

  return {
    socket,
    isConnected,
    roomMembers,
    emitContentChange,
    emitCursorChange,
    emitVoiceTranscription,
  };
}
