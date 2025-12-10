import { ref, onUnmounted, type Ref } from "vue";
import {
  JanusDialogenService,
  type Player,
  type GameMessage,
  type SettingsUpdate,
} from "../utils/JanusService";
import adapter from "webrtc-adapter";
(window as any).adapter = adapter;

export interface UseJanusRoomReturn {
  players: Ref<Player[]>;
  messages: Ref<GameMessage[]>;
  isConnected: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  status: Ref<string>;
  gameSettings: Ref<{ mode: string; timeLimit: string }>; // ✅ TAMBAHKAN
  maxPlayers: Ref<number>;
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
  onSettingsUpdate: (callback: (settings: SettingsUpdate) => void) => void;
  broadcastSettingsUpdate: (settings: SettingsUpdate) => boolean;
  roomCode: Ref<string>;
  username: Ref<string>;
  isHost: Ref<boolean>;
}

let janusService: JanusDialogenService | null = null;

// ✅ CRITICAL FIX: Global deduplication set for messages
const processedMessageIds = new Set<string>();

// ✅ NEW: Track ALL active player refs across all components
const activePlayerRefs = new Set<Ref<Player[]>>();
const activeMessageRefs = new Set<Ref<GameMessage[]>>();
const activeStatusRefs = new Set<Ref<string>>();

let callbacksRegistered = false;
const activeGameSettingsRefs = new Set<
  Ref<{ mode: string; timeLimit: string }>
>();
const activeMaxPlayersRefs = new Set<Ref<number>>();

export function useJanusRoom(
  serverUrl: string = "https://janus.cloudwego.net/janus"
): UseJanusRoomReturn {
  if (!janusService) {
    janusService = new JanusDialogenService(serverUrl);
  }

  const players = ref<Player[]>([]);
  const messages = ref<GameMessage[]>([]);
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const status = ref("");
  const roomCode = ref("");
  const username = ref("");
  const isHost = ref(false);
  const gameSettings = ref({ mode: "Bahasa", timeLimit: "2" }); // ✅ TAMBAHKAN
  const maxPlayers = ref(5);

  // ✅ Register this instance's refs
  activePlayerRefs.add(players);
  activeMessageRefs.add(messages);
  activeStatusRefs.add(status);
  activeGameSettingsRefs.add(gameSettings); // ✅ TAMBAHKAN
  activeMaxPlayersRefs.add(maxPlayers);

  // ✅ Sync dari service IMMEDIATELY untuk ALL refs
  const servicePlayers = janusService.getPlayers();
  if (servicePlayers.length > 0) {
    players.value = [...servicePlayers];
    console.log(
      "[useJanusRoom] 🔄 Synced players on mount:",
      players.value.length
    );
  }

  if (!callbacksRegistered && janusService) {
    console.log("[useJanusRoom] 🎯 Registering callbacks (ONE TIME ONLY)");

    janusService.onPlayerJoin((player: Player) => {
      console.log(
        "[useJanusRoom] Player joined callback triggered:",
        player.username
      );

      // ✅ Update ALL active refs
      activePlayerRefs.forEach((playersRef) => {
        const existingIndex = playersRef.value.findIndex(
          (p) => p.username === player.username
        );
        if (existingIndex === -1) {
          playersRef.value.push(player);
          console.log(`[useJanusRoom] ✅ Added ${player.username} to a ref`);
        } else {
          playersRef.value[existingIndex] = player;
          console.log(`[useJanusRoom] ♻️ Updated ${player.username} in a ref`);
        }
      });
    });

    janusService.onPlayerLeave((playerUsername: string) => {
      console.log(
        "[useJanusRoom] Player left callback triggered:",
        playerUsername
      );

      // ✅ Update ALL active refs
      activePlayerRefs.forEach((playersRef) => {
        playersRef.value = playersRef.value.filter(
          (p) => p.username !== playerUsername
        );
      });
    });

    janusService.onMessage((msg: GameMessage) => {
      const msgId = `${msg.type}_${msg.sender}_${
        msg.timestamp
      }_${msg.message?.substring(0, 50)}`;

      if (processedMessageIds.has(msgId)) {
        console.log(`[useJanusRoom] 🚫 Skip duplicate message`);
        return;
      }

      processedMessageIds.add(msgId);

      if (processedMessageIds.size > 100) {
        const firstKey = processedMessageIds.values().next().value;
        if (firstKey) processedMessageIds.delete(firstKey);
      }

      console.log("[useJanusRoom] ✅ Message received:", msg.type, msg.sender);

      // Handle nested JSON...
      if (msg.type === "chat" && msg.message) {
        try {
          const parsed = JSON.parse(msg.message);
          if (parsed.type === "game_event" && parsed.event === "start_game") {
            const gameEventMessage: GameMessage = {
              type: "game_event",
              room_code: msg.room_code,
              sender: msg.sender,
              message: "Game started",
              timestamp: msg.timestamp,
              data: { event: "start_game", ...parsed.data },
            };

            // ✅ Push to ALL active message refs
            activeMessageRefs.forEach((msgRef) => {
              msgRef.value.push(gameEventMessage);
            });
            return;
          }
        } catch (e) {
          // Not JSON
        }
      }

      // ✅ Push to ALL active message refs
      activeMessageRefs.forEach((msgRef) => {
        msgRef.value.push(msg);
      });
    });

    janusService.onGameStart((data: any) => {
      console.log("[useJanusRoom] Game started (direct):", data);
      const gameEventMessage: GameMessage = {
        type: "game_event",
        room_code: roomCode.value,
        sender: "system",
        message: "Game started",
        timestamp: new Date().toISOString(),
        data: { event: "start_game", ...data },
      };

      // ✅ Push to ALL active message refs
      activeMessageRefs.forEach((msgRef) => {
        msgRef.value.push(gameEventMessage);
      });
    });

    janusService.onStatus((statusMsg: string) => {
      console.log("[useJanusRoom] Status:", statusMsg);

      // ✅ Update ALL active status refs
      activeStatusRefs.forEach((statusRef) => {
        statusRef.value = statusMsg;
      });
    });

    janusService.onSettingsUpdate((settings: SettingsUpdate) => {
      console.log("[useJanusRoom] Settings update received:", settings);

      // ✅ ONLY update untuk NON-HOST (guests)
      // Host sudah punya value yang benar dari user input
      activeGameSettingsRefs.forEach((settingsRef) => {
        settingsRef.value = {
          mode: settings.mode,
          timeLimit: settings.timeLimit,
        };
        console.log("[useJanusRoom] ✅ Updated gameSettings in a ref");
      });

      if (settings.maxPlayers !== undefined) {
        activeMaxPlayersRefs.forEach((maxPlayersRef) => {
          maxPlayersRef.value = settings.maxPlayers!;
          console.log("[useJanusRoom] ✅ Updated maxPlayers in a ref");
        });
      }
    });

    callbacksRegistered = true;
  }

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

      // ✅ Sync to current ref
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
        // ✅ Sync to current ref
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

      // ✅ Clear processed messages
      processedMessageIds.clear();

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

  const onSettingsUpdate = (callback: (settings: SettingsUpdate) => void) => {
    janusService!.onSettingsUpdate(callback);
  };

  const broadcastSettingsUpdate = (settings: SettingsUpdate): boolean => {
    if (!janusService!.isRoomHost()) {
      error.value = "Only host can update settings";
      return false;
    }

    const success = janusService!.broadcastSettingsUpdate(settings);
    if (!success) {
      error.value = "Failed to broadcast settings";
    }
    return success;
  };

  onUnmounted(() => {
    // ✅ Cleanup: Remove this instance's refs
    activePlayerRefs.delete(players);
    activeMessageRefs.delete(messages);
    activeStatusRefs.delete(status);
    activeGameSettingsRefs.delete(gameSettings);
    activeMaxPlayersRefs.delete(maxPlayers);

    console.log("[useJanusRoom] Component unmounted, refs cleaned up");
    console.log("[useJanusRoom] Active refs remaining:", activePlayerRefs.size);
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
    gameSettings,
    maxPlayers,
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
    onSettingsUpdate,
    broadcastSettingsUpdate,
  };
}
