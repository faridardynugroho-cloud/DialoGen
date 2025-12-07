import { ref, onUnmounted, type Ref } from "vue";
import {
  JanusDialogenService,
  type Player,
  type GameMessage,
} from "../utils/JanusService";
import adapter from "webrtc-adapter";
(window as any).adapter = adapter;

export interface UseJanusRoomReturn {
  // State
  players: Ref<Player[]>;
  messages: Ref<GameMessage[]>;
  isConnected: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  status: Ref<string>;

  // Methods
  init: () => Promise<void>;
  createRoom: (roomCode: string, username: string) => Promise<void>;
  joinRoom: (roomCode: string, username: string) => Promise<void>;
  sendMessage: (message: string) => boolean;
  startGame: (settings: any) => boolean;
  leaveRoom: () => Promise<void>;
  isInRoom: () => boolean;
  hasActivePlugin: () => boolean;
  getRoomInfo: () => any;
  getPlayers: () => Player[];
  onHostDisconnect: (callback: () => void) => void;

  // Room info
  roomCode: Ref<string>;
  username: Ref<string>;
  isHost: Ref<boolean>;
}

let janusService: JanusDialogenService | null = null;

export function useJanusRoom(
  serverUrl: string = "https://janus.cloudwego.net/janus"
): UseJanusRoomReturn {
  // Initialize service once
  if (!janusService) {
    janusService = new JanusDialogenService(serverUrl);
  }

  // Reactive state
  const players = ref<Player[]>([]);
  const messages = ref<GameMessage[]>([]);
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const status = ref("");
  const roomCode = ref("");
  const username = ref("");
  const isHost = ref(false);

  // Setup callbacks
  janusService.onPlayerJoin((player: Player) => {
    console.log("[useJanusRoom] Player joined:", player);

    const existingIndex = players.value.findIndex(
      (p) => p.username === player.username
    );
    if (existingIndex === -1) {
      players.value.push(player);
    } else {
      players.value[existingIndex] = player;
    }
  });

  janusService.onPlayerLeave((playerUsername: string) => {
    console.log("[useJanusRoom] Player left:", playerUsername);
    players.value = players.value.filter((p) => p.username !== playerUsername);
  });

  // ✅ CRITICAL FIX: Handle BOTH onMessage AND onGameStart
  janusService.onMessage((msg: GameMessage) => {
    console.log("[useJanusRoom] Message received:", msg);
    
    // ✅ Parse nested JSON in message field
    if (msg.type === "chat" && msg.message) {
      try {
        const parsed = JSON.parse(msg.message);
        console.log("[useJanusRoom] Parsed nested message:", parsed);
        
        // ✅ Check if it's actually a game_event
        if (parsed.type === "game_event" && parsed.event === "start_game") {
          console.log("[useJanusRoom] 🎮 GAME START detected in chat message!");
          
          // Convert to proper game_event and push to messages
          const gameEventMessage: GameMessage = {
            type: "game_event",
            room_code: roomCode.value,
            sender: msg.sender,
            message: "Game started",
            timestamp: msg.timestamp,
            data: {
              event: "start_game",
              ...parsed.data
            }
          };
          
          messages.value.push(gameEventMessage);
          console.log("[useJanusRoom] ✅ Pushed game_event to messages");
          return; // Don't push the original chat message
        }
      } catch (e) {
        // Not JSON, treat as regular message
      }
    }
    
    // Push regular messages
    messages.value.push(msg);
  });

  // ✅ Keep onGameStart for direct game_event type
  janusService.onGameStart((data: any) => {
    console.log("[useJanusRoom] Game started (direct):", data);
    
    const gameEventMessage: GameMessage = {
      type: "game_event",
      room_code: roomCode.value,
      sender: "system",
      message: "Game started",
      timestamp: new Date().toISOString(),
      data: {
        event: "start_game",
        ...data
      }
    };
    
    messages.value.push(gameEventMessage);
    console.log("[useJanusRoom] ✅ Pushed game_event to messages (direct)");
  });

  janusService.onStatus((statusMsg: string) => {
    console.log("[useJanusRoom] Status:", statusMsg);
    status.value = statusMsg;
  });

  // Methods
  const init = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      await janusService!.init();
      isConnected.value = true;
      console.log("[useJanusRoom] ✅ Janus initialized");
    } catch (err: any) {
      error.value = err.message || "Failed to initialize Janus";
      console.error("[useJanusRoom] Init error:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createRoom = async (code: string, user: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      await janusService!.createRoom(code, user);
      roomCode.value = code;
      username.value = user;
      isHost.value = true;

      players.value = janusService!.getPlayers();

      console.log("[useJanusRoom] ✅ Room created");
    } catch (err: any) {
      error.value = err.message || "Failed to create room";
      console.error("[useJanusRoom] Create room error:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const joinRoom = async (code: string, user: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      await janusService!.joinRoom(code, user);
      roomCode.value = code;
      username.value = user;
      isHost.value = false;

      janusService!.requestParticipants();

      setTimeout(() => {
        players.value = janusService!.getPlayers();
        console.log("[useJanusRoom] Synced players after join:", players.value);
        
        if (players.value.length === 0) {
          console.warn("[useJanusRoom] Players empty, requesting again...");
          janusService!.requestParticipants();
          setTimeout(() => {
            players.value = janusService!.getPlayers();
          }, 500);
        }
      }, 500);

      console.log("[useJanusRoom] ✅ Joined room");
    } catch (err: any) {
      error.value = err.message || "Failed to join room";
      console.error("[useJanusRoom] Join room error:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const isInRoom = (): boolean => {
    return janusService?.isInRoom() || false;
  };

  const hasActivePlugin = (): boolean => {
    return janusService?.hasActivePlugin() || false;
  };

  const getRoomInfo = () => {
    return janusService?.getRoomInfo() || null;
  };

  const getPlayers = (): Player[] => {
    return janusService?.getPlayers() || [];
  };

  const sendMessage = (message: string): boolean => {
    const success = janusService!.sendMessage(message);
    if (!success) {
      error.value = "Failed to send message";
    }
    return success;
  };

  const startGame = (settings: any): boolean => {
    if (!janusService!.isRoomHost()) {
      error.value = "Only host can start the game";
      return false;
    }

    const success = janusService!.broadcastGameStart(settings);
    if (!success) {
      error.value = "Failed to start game";
    }
    return success;
  };

  const leaveRoom = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      await janusService!.leaveRoom();

      players.value = [];
      messages.value = [];
      roomCode.value = "";
      username.value = "";
      isHost.value = false;

      console.log("[useJanusRoom] ✅ Left room");
    } catch (err: any) {
      error.value = err.message || "Failed to leave room";
      console.error("[useJanusRoom] Leave room error:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const onHostDisconnect = (callback: () => void) => {
    janusService!.onHostDisconnect(callback);
  };

  onUnmounted(() => {
    console.log("[useJanusRoom] Component unmounted, keeping room alive");
  });

  return {
    players,
    messages,
    isConnected,
    isLoading,
    error,
    status,
    roomCode,
    username,
    isHost,
    init,
    createRoom,
    joinRoom,
    sendMessage,
    startGame,
    leaveRoom,
    isInRoom,
    hasActivePlugin,
    getRoomInfo,
    getPlayers,
    onHostDisconnect,
  };
}