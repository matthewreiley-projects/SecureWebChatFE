import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import "./RoomChat.css";

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://192.168.86.22:3000";

export default function RoomChat() {
  const { id, roomName } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [me, setMe] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [keysByVersion, setKeysByVersion] = useState(new Map());
  const [room, setRoom] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const keysByVersionRef = useRef(new Map());
  const messagesEndRef = useRef();
  const messagesContainerRef = useRef();
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    let s;

    const initRoom = async () => {
      try {
        const userRes = await axios.get(`${API_BASE_URL}/api/users/me`, {
          withCredentials: true,
        });
        setMe(userRes.data._id);

        const roomRes = await axios.get(`${API_BASE_URL}/api/rooms/${id}`, {
          withCredentials: true,
        });
        setRoom(roomRes.data);

        setMessages([]);
        setHasMore(true);

        await fetchMessages(new Map(), 0, false);

        s = io(API_BASE_URL, {
          withCredentials: true,
          autoConnect: false,
        });

        // --- SOCKET EVENTS ---
        s.on("connect", () => {
          console.log("[socket] connected:", s.id);
          s.emit("joinRoom", id);
        });

        s.on("connect_error", (err) => console.error("[socket] error:", err));

        s.on("roomKeys", async ({ keys }) => {
          const map = new Map();
          for (const k of keys) {
            const decryptedKey = await decryptRoomKey(k.encryptedKey);
            map.set(k.version, decryptedKey);
          }
          setKeysByVersion(map);
          keysByVersionRef.current = map;
          await fetchMessages(map, 0, false);
        });

        s.on("chatMessage", async (msg) => {
          const key = keysByVersionRef.current.get(msg.keyVersion);
          msg.content = key
            ? await tryDecrypt(msg.content, msg.iv, key)
            : `[Unknown key version: ${msg.keyVersion}]`;

          setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
          scrollToBottom();
        });

        s.on("youAreKicked", () => {
          alert("You have been removed from this room.");
          navigate("/");
        });

        s.on("userKicked", ({ userId }) => {
          console.log("User kicked:", userId);
        });

        s.on("onlineUsers", (users) => setOnlineUsers(users));

        s.on("roomKeyUpdated", async ({ encryptedKeys, message }) => {
          const encryptedKeyB64 = encryptedKeys[me];
          if (!encryptedKeyB64) return;
          try {
            const newKey = await decryptRoomKey(encryptedKeyB64);
            setKeysByVersion((prev) => {
              const map = new Map(prev);
              map.set(message.newKeyVersion, newKey);
              return map;
            });
            alert("Room keys rotated. New key active.");
          } catch {
            alert("Failed to decrypt new key. Reload page.");
          }
        });

        s.connect();
        setSocket(s);
      } catch (err) {
        console.error("Initialization error:", err);
        if (err.response?.status === 403) navigate("/");
      }
    };

    initRoom();
    return () => {
      if (s) s.disconnect();
    };
  }, [id, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (keysMap, skip = 0, prepend = false) => {
    try {
      loadingMoreRef.current = true;
      setLoadingMore(true);

      const container = messagesContainerRef.current;
      const oldScrollHeight = container?.scrollHeight;

      const res = await axios.get(`${API_BASE_URL}/api/rooms/${id}/messages?skip=${skip}&limit=20`, {
        withCredentials: true,
      });

      const decrypted = await Promise.all(
        res.data.map(async (m) => {
          const key = keysMap.get(m.keyVersion);
          const content = key
            ? await tryDecrypt(m.content, m.iv, key)
            : `[Unknown key version: ${m.keyVersion}]`;
          return { ...m, content };
        })
      );

      if (prepend) {
        setMessages((prev) => {
          const deduped = decrypted.filter((m) => !prev.some((p) => p._id === m._id));
          return [...deduped, ...prev];
        });
        setTimeout(() => {
          const newScrollHeight = container?.scrollHeight;
          if (container && newScrollHeight && oldScrollHeight) {
            container.scrollTop = newScrollHeight - oldScrollHeight;
          }
        }, 0);
      } else {
        setMessages(decrypted);
        scrollToBottom();
      }

      if (res.data.length < 20) setHasMore(false);

      loadingMoreRef.current = false;
      setLoadingMore(false);
    } catch (e) {
      console.error("Failed to fetch/decrypt messages", e);
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  const tryDecrypt = async (contentB64, ivB64, key) => {
    try {
      const ciphertext = Uint8Array.from(atob(contentB64), (c) => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
      const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
      return new TextDecoder().decode(decryptedBuffer);
    } catch {
      return "[Failed to decrypt message]";
    }
  };

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el || loadingMoreRef.current || !hasMore) return;

    if (el.scrollTop < 100) {
      loadingMoreRef.current = true;
      fetchMessages(keysByVersionRef.current, messages.length, true).finally(() => {
        loadingMoreRef.current = false;
      });
    }
  }, [messages.length, hasMore]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const sendMessage = async () => {
    if (!input.trim() || !keysByVersion.size || !socket) return;
    const currentKey = keysByVersion.get(room.currentKeyVersion);
    if (!currentKey) return;

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        currentKey,
        encoder.encode(input)
      );

      const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
      const ivB64 = btoa(String.fromCharCode(...iv));

      socket.emit("chatMessage", {
        roomId: id,
        message: ciphertextB64,
        iv: ivB64,
        keyVersion: room.currentKeyVersion,
      });

      setInput("");
    } catch (e) {
      console.error("Failed to encrypt/send message", e);
    }
  };

  const decryptRoomKey = async (encryptedKeyB64) => {
    const privateKeyJwk = JSON.parse(localStorage.getItem("privateKey"));
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );
    const encryptedKey = Uint8Array.from(atob(encryptedKeyB64), (c) => c.charCodeAt(0));
    const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKey
    );
    return await window.crypto.subtle.importKey(
      "raw",
      decryptedKeyBuffer,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  };

  const isOwnerOrAdmin =
    me && room && (room.owner?._id === me || room.admins?.some((a) => a._id === me));

  return (
    <div className="chat-page">
      <div className="chat-card">
        <h2>{roomName}</h2>
        <div className="chat-body">
          {isOwnerOrAdmin && (
            <div className="manage-room-panel">
              <h3>Manage Room</h3>
              <Link to={`/rooms/${id}/edit`} className="manage-btn">✏️ Edit Room</Link>
              <Link to={`/invite-users/${id}`} className="manage-btn">📩 Invite Users</Link>
              <Link to={`/rooms/${id}/manage`} className="manage-btn">⚙️ Manage</Link>
            </div>
          )}

          <div className="chat-messages" ref={messagesContainerRef}>
            {messages.map((m) => {
              const isMe = m.user?._id === me;
              const formattedTime = new Date(m.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              return (
                <div key={m._id} className={`chat-message ${isMe ? "my-message" : "other-message"}`}>
                  <div className="chat-header">
                    <span className="chat-user">{m.user?.username}</span>
                    <span className="chat-time">{formattedTime}</span>
                  </div>
                  <span className="chat-content">{m.content}</span>
                </div>
              );
            })}
            {loadingMore && <div className="loading">Loading older messages...</div>}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="online-users">
            <h3>
              Online Now <span className="online-light"></span>
            </h3>
            <ul>{onlineUsers.map((u) => <li key={u._id}>{u.username}</li>)}</ul>
          </div>
        </div>

        <div className="chat-input-container">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className="chat-send-btn">Send</button>
        </div>
      </div>
    </div>
  );
}
