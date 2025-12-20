import { ref, onUnmounted, type Ref } from "vue";
import {
  JanusDialogenService,
  type Player,
  type GameMessage,
  type SettingsUpdate,
} from "../utils/JanusService";
import { getJanusService } from "../utils/JanusService";
import adapter from "webrtc-adapter";
(window as any).adapter = adapter;

export interface UseJanusRoomReturn {
  players: Ref<Player[]>;
  messages: Ref<GameMessage[]>;
  isConnected: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  status: Ref<string>;
  gameSettings: Ref<{ mode: string; timeLimit: string }>;
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
const processedMessageIds = new Set<string>();
const GLOBAL_CALLBACKS_REGISTERED = { value: false };
const MAX_CONCURRENT_CONNECTIONS = 5;
const activeConnections = new Set<string>();

const activePlayerRefs = new Set<Ref<Player[]>>();
const activeMessageRefs = new Set<Ref<GameMessage[]>>();
const activeStatusRefs = new Set<Ref<string>>();

const activeGameSettingsRefs = new Set<
  Ref<{ mode: string; timeLimit: string }>
>();
const activeMaxPlayersRefs = new Set<Ref<number>>();

// ✅ CRITICAL: Track locked usernames per tab/window
const WINDOW_ID = `window_${Date.now()}_${Math.random()
  .toString(36)
  .substr(2, 9)}`;
const lockedUsernames = new Map<string, string>(); // windowId -> username

export function useJanusRoom(
  serverUrl: string = "https://janus.cloudwego.net/janus"
): UseJanusRoomReturn {
  console.log("=".repeat(60));
  console.log(`[useJanusRoom] 🆕 NEW INSTANCE - Window ID: ${WINDOW_ID}`);
  console.log("=".repeat(60));

  // ✅ NEW: Use singleton service
  if (!janusService) {
    janusService = getJanusService(serverUrl);
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
  const gameSettings = ref({ mode: "Bahasa", timeLimit: "2" });
  const maxPlayers = ref(5);

  activePlayerRefs.add(players);
  activeMessageRefs.add(messages);
  activeStatusRefs.add(status);
  activeGameSettingsRefs.add(gameSettings);
  activeMaxPlayersRefs.add(maxPlayers);

  const servicePlayers = janusService.getPlayers();
  if (servicePlayers.length > 0) {
    players.value = [...servicePlayers];
    console.log(
      `[useJanusRoom:${WINDOW_ID}] 🔄 Synced players on mount:`,
      players.value.length
    );
  }

  if (!GLOBAL_CALLBACKS_REGISTERED.value && janusService) {
    console.log(
      `[useJanusRoom:${WINDOW_ID}] 🎯 Registering GLOBAL callbacks (ONE TIME ONLY)`
    );

    janusService.onPlayerJoin((player: Player) => {
      console.log(
        `[useJanusRoom:${WINDOW_ID}] Player joined callback triggered:`,
        player.username
      );

      activePlayerRefs.forEach((playersRef) => {
        const existingIndex = playersRef.value.findIndex(
          (p) => p.username === player.username
        );
        if (existingIndex === -1) {
          playersRef.value.push(player);
          console.log(
            `[useJanusRoom:${WINDOW_ID}] ✅ Added ${player.username} to a ref`
          );
        } else {
          playersRef.value[existingIndex] = player;
          console.log(
            `[useJanusRoom:${WINDOW_ID}] ♻️ Updated ${player.username} in a ref`
          );
        }
      });
    });

    janusService.onPlayerLeave((playerUsername: string) => {
      console.log(
        `[useJanusRoom:${WINDOW_ID}] Player left callback triggered:`,
        playerUsername
      );

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
        console.log(`[useJanusRoom:${WINDOW_ID}] 🚫 Skip duplicate message`);
        return;
      }

      processedMessageIds.add(msgId);

      if (processedMessageIds.size > 100) {
        const firstKey = processedMessageIds.values().next().value;
        if (firstKey) processedMessageIds.delete(firstKey);
      }

      console.log(
        `[useJanusRoom:${WINDOW_ID}] ✅ Message received:`,
        msg.type,
        msg.sender
      );

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

            activeMessageRefs.forEach((msgRef) => {
              msgRef.value.push(gameEventMessage);
            });
            return;
          }
        } catch (e) {
          // Not JSON
        }
      }

      activeMessageRefs.forEach((msgRef) => {
        msgRef.value.push(msg);
      });
    });

    janusService.onGameStart((data: any) => {
      console.log(`[useJanusRoom:${WINDOW_ID}] Game started (direct):`, data);
      const gameEventMessage: GameMessage = {
        type: "game_event",
        room_code: roomCode.value,
        sender: "system",
        message: "Game started",
        timestamp: new Date().toISOString(),
        data: { event: "start_game", ...data },
      };

      activeMessageRefs.forEach((msgRef) => {
        msgRef.value.push(gameEventMessage);
      });
    });

    janusService.onStatus((statusMsg: string) => {
      console.log(`[useJanusRoom:${WINDOW_ID}] Status:`, statusMsg);

      activeStatusRefs.forEach((statusRef) => {
        statusRef.value = statusMsg;
      });
    });

    janusService.onSettingsUpdate((settings: SettingsUpdate) => {
      console.log(
        `[useJanusRoom:${WINDOW_ID}] Settings update received:`,
        settings
      );

      activeGameSettingsRefs.forEach((settingsRef) => {
        settingsRef.value = {
          mode: settings.mode,
          timeLimit: settings.timeLimit,
        };
        console.log(
          `[useJanusRoom:${WINDOW_ID}] ✅ Updated gameSettings in a ref`
        );
      });

      if (settings.maxPlayers !== undefined) {
        activeMaxPlayersRefs.forEach((maxPlayersRef) => {
          maxPlayersRef.value = settings.maxPlayers!;
          console.log(
            `[useJanusRoom:${WINDOW_ID}] ✅ Updated maxPlayers in a ref`
          );
        });
      }
    });

    GLOBAL_CALLBACKS_REGISTERED.value = true;
  }

  const init = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      await janusService!.init();
      isConnected.value = true;
      console.log(`[useJanusRoom:${WINDOW_ID}] ✅ Janus initialized`);
    } catch (err: any) {
      error.value = err.message || "Failed to initialize Janus";
      console.error(`[useJanusRoom:${WINDOW_ID}] Init error:`, err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createRoom = async (code: string, user: string) => {
    console.log("=".repeat(60));
    console.log(`[useJanusRoom:${WINDOW_ID}] 🏠 CREATE ROOM`);
    console.log(`  Room Code: ${code}`);
    console.log(`  Username: ${user}`);
    console.log(`  Window ID: ${WINDOW_ID}`);
    console.log("=".repeat(60));

    if (activeConnections.size >= MAX_CONCURRENT_CONNECTIONS) {
      console.warn(
        `[useJanusRoom:${WINDOW_ID}] ⚠️ Connection limit reached (${activeConnections.size}/${MAX_CONCURRENT_CONNECTIONS})`
      );

      error.value = `Too many connections. Please wait...`;

      // Wait for slot to free up (max 10 seconds)
      const maxWait = 10000;
      const startTime = Date.now();

      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (activeConnections.size < MAX_CONCURRENT_CONNECTIONS) {
            clearInterval(checkInterval);
            error.value = null;
            resolve(true);
          } else if (Date.now() - startTime > maxWait) {
            clearInterval(checkInterval);
            reject(new Error("Connection timeout"));
          }
        }, 500);
      });
    }

    const connectionId = `${code}_${user}_${Date.now()}`;
    activeConnections.add(connectionId);
    console.log(
      `[useJanusRoom:${WINDOW_ID}] 🔌 Active connections: ${activeConnections.size}`
    );

    isLoading.value = true;
    error.value = null;

    try {
      await janusService!.createRoom(code, user);
      roomCode.value = code;
      username.value = user;
      isHost.value = true;

      // ✅ CRITICAL: Lock username untuk window ini
      lockedUsernames.set(WINDOW_ID, user);

      // ✅ CRITICAL: Set ke sessionStorage (tidak shared antar tabs!)
      sessionStorage.setItem("lockedUsername", user);
      sessionStorage.setItem("lockedRoomCode", code);
      sessionStorage.setItem("lockedIsHost", "true");
      sessionStorage.setItem("windowId", WINDOW_ID);

      console.log(`[useJanusRoom:${WINDOW_ID}] 🔒 LOCKED USERNAME: ${user}`);
      console.log(`[useJanusRoom:${WINDOW_ID}] 💾 Saved to sessionStorage:`, {
        lockedUsername: user,
        lockedRoomCode: code,
        lockedIsHost: true,
        windowId: WINDOW_ID,
      });

      // ✅ Verify localStorage (might be corrupted)
      const lsUsername = localStorage.getItem("username");
      const lsIsHost = localStorage.getItem("isHost");

      console.log(`[useJanusRoom:${WINDOW_ID}] 🔍 localStorage check:`, {
        username: lsUsername,
        isHost: lsIsHost,
        match: lsUsername === user,
      });

      if (lsUsername !== user) {
        console.warn(
          `[useJanusRoom:${WINDOW_ID}] ⚠️ localStorage.username MISMATCH!`
        );
        console.warn(`  Expected: ${user}`);
        console.warn(`  Got: ${lsUsername}`);
        console.warn(`  Fixing localStorage...`);

        localStorage.setItem("username", user);
        localStorage.setItem("roomCode", code);
        localStorage.setItem("isHost", "true");

        console.log(`[useJanusRoom:${WINDOW_ID}] ✅ Fixed localStorage`);
      }

      players.value = janusService!.getPlayers();

      console.log(`[useJanusRoom:${WINDOW_ID}] ✅ Room created successfully`);
      console.log(
        `[useJanusRoom:${WINDOW_ID}] Players in room:`,
        players.value.map((p) => p.username)
      );
    } catch (err: any) {
      error.value = err.message || "Failed to create room";
      console.error(`[useJanusRoom:${WINDOW_ID}] Create room error:`, err);
      throw err;
    } finally {
      activeConnections.delete(connectionId);
      console.log(
        `[useJanusRoom:${WINDOW_ID}] 🔌 Active connections: ${activeConnections.size}`
      );
      isLoading.value = false;
    }
  };

  const joinRoom = async (code: string, user: string) => {
    console.log("=".repeat(60));
    console.log(`[useJanusRoom:${WINDOW_ID}] 🚪 JOIN ROOM`);
    console.log(`  Room Code: ${code}`);
    console.log(`  Username: ${user}`);
    console.log(`  Window ID: ${WINDOW_ID}`);
    console.log("=".repeat(60));

    if (activeConnections.size >= MAX_CONCURRENT_CONNECTIONS) {
      console.warn(
        `[useJanusRoom:${WINDOW_ID}] ⚠️ Connection limit reached (${activeConnections.size}/${MAX_CONCURRENT_CONNECTIONS})`
      );

      error.value = `Too many connections. Please wait...`;

      // Wait for slot to free up (max 10 seconds)
      const maxWait = 10000;
      const startTime = Date.now();

      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (activeConnections.size < MAX_CONCURRENT_CONNECTIONS) {
            clearInterval(checkInterval);
            error.value = null;
            resolve(true);
          } else if (Date.now() - startTime > maxWait) {
            clearInterval(checkInterval);
            reject(new Error("Connection timeout"));
          }
        }, 500);
      });
    }

    const connectionId = `${code}_${user}_${Date.now()}`;
    activeConnections.add(connectionId);

    isLoading.value = true;
    error.value = null;

    try {
      await janusService!.joinRoom(code, user);
      roomCode.value = code;
      username.value = user;
      isHost.value = false;

      // ✅ CRITICAL: Lock username untuk window ini
      lockedUsernames.set(WINDOW_ID, user);

      // ✅ CRITICAL: Set ke sessionStorage (tidak shared antar tabs!)
      sessionStorage.setItem("lockedUsername", user);
      sessionStorage.setItem("lockedRoomCode", code);
      sessionStorage.setItem("lockedIsHost", "false");
      sessionStorage.setItem("windowId", WINDOW_ID);

      console.log(`[useJanusRoom:${WINDOW_ID}] 🔒 LOCKED USERNAME: ${user}`);
      console.log(`[useJanusRoom:${WINDOW_ID}] 💾 Saved to sessionStorage:`, {
        lockedUsername: user,
        lockedRoomCode: code,
        lockedIsHost: false,
        windowId: WINDOW_ID,
      });

      // ✅ Verify localStorage (might be corrupted)
      const lsUsername = localStorage.getItem("username");
      const lsIsHost = localStorage.getItem("isHost");

      console.log(`[useJanusRoom:${WINDOW_ID}] 🔍 localStorage check:`, {
        username: lsUsername,
        isHost: lsIsHost,
        match: lsUsername === user,
      });

      if (lsUsername !== user) {
        console.warn(
          `[useJanusRoom:${WINDOW_ID}] ⚠️ localStorage.username MISMATCH!`
        );
        console.warn(`  Expected: ${user}`);
        console.warn(`  Got: ${lsUsername}`);
        console.warn(`  Fixing localStorage...`);

        localStorage.setItem("username", user);
        localStorage.setItem("roomCode", code);
        localStorage.setItem("isHost", "false");

        console.log(`[useJanusRoom:${WINDOW_ID}] ✅ Fixed localStorage`);
      }

      janusService!.requestParticipants();

      setTimeout(() => {
        players.value = janusService!.getPlayers();
        console.log(
          `[useJanusRoom:${WINDOW_ID}] Synced players after join:`,
          players.value.map((p) => p.username)
        );

        if (players.value.length === 0) {
          console.warn(
            `[useJanusRoom:${WINDOW_ID}] Players empty, requesting again...`
          );
          janusService!.requestParticipants();
          setTimeout(() => {
            players.value = janusService!.getPlayers();
          }, 500);
        }
      }, 500);

      console.log(`[useJanusRoom:${WINDOW_ID}] ✅ Joined room successfully`);
    } catch (err: any) {
      error.value = err.message || "Failed to join room";
      console.error(`[useJanusRoom:${WINDOW_ID}] Join room error:`, err);
      throw err;
    } finally {
      activeConnections.delete(connectionId);
      console.log(
        `[useJanusRoom:${WINDOW_ID}] 🔌 Active connections: ${activeConnections.size}`
      );
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
    console.log("=".repeat(60));
    console.log(`[useJanusRoom:${WINDOW_ID}] 🎮 START GAME`);
    console.log(`  Settings:`, settings);
    console.log(`  Username:`, username.value);
    console.log(`  isHost:`, isHost.value);
    console.log(`  Window ID:`, WINDOW_ID);

    // ✅ Verify locked username
    const sessionUsername = sessionStorage.getItem("lockedUsername");
    const sessionIsHost = sessionStorage.getItem("lockedIsHost");

    console.log(`  sessionStorage.lockedUsername:`, sessionUsername);
    console.log(`  sessionStorage.lockedIsHost:`, sessionIsHost);

    if (sessionUsername !== username.value) {
      console.error(
        `[useJanusRoom:${WINDOW_ID}] ❌ USERNAME MISMATCH DETECTED!`
      );
      console.error(`  composable.username: ${username.value}`);
      console.error(`  sessionStorage: ${sessionUsername}`);
    }
    console.log("=".repeat(60));

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

      // ✅ Clear locked username
      lockedUsernames.delete(WINDOW_ID);
      sessionStorage.clear();

      processedMessageIds.clear();
      await janusService!.destroy();

      console.log(`[useJanusRoom:${WINDOW_ID}] ✅ Left room`);
    } catch (err: any) {
      error.value = err.message || "Failed to leave room";
      console.error(`[useJanusRoom:${WINDOW_ID}] Leave room error:`, err);
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
    activePlayerRefs.delete(players);
    activeMessageRefs.delete(messages);
    activeStatusRefs.delete(status);
    activeGameSettingsRefs.delete(gameSettings);
    activeMaxPlayersRefs.delete(maxPlayers);

    console.log(
      `[useJanusRoom:${WINDOW_ID}] Component unmounted, refs cleaned up`
    );
    console.log(
      `[useJanusRoom:${WINDOW_ID}] Active refs remaining:`,
      activePlayerRefs.size
    );
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
