/* eslint-disable @typescript-eslint/no-explicit-any */

let Janus: any = null;
let globalJanusService: JanusDialogenService | null = null;
let initializationPromise: Promise<void> | null = null;

export function getJanusService(serverUrl: string): JanusDialogenService {
  if (!globalJanusService) {
    console.log("[Janus] 🆕 Creating GLOBAL singleton instance");
    globalJanusService = new JanusDialogenService(serverUrl);
  } else {
    console.log("[Janus] ♻️ Reusing existing singleton");
  }
  return globalJanusService;
}

// ✅ Dynamic import - hanya di browser
async function loadJanus() {
  if (typeof window === "undefined") {
    console.warn("[Janus] Running in server environment → skip");
    return null;
  }

  if (Janus) return Janus;

  try {
    // ✅ Dynamic import hanya saat di browser
    const janusModule = await import("janus-gateway");
    Janus = janusModule.default;
    console.log("[Janus] ✅ Library loaded dynamically");
    return Janus;
  } catch (err) {
    console.error("[Janus] ❌ Failed to load:", err);
    return null;
  }
}

export interface Player {
  username: string;
  isHost: boolean;
  joined_at: string;
}

export interface GameMessage {
  type: "chat" | "system" | "game_event";
  room_code: string;
  sender: string;
  message: string;
  timestamp: string;
  data?: any;
}

export interface SettingsUpdate {
  mode: string;
  timeLimit: string;
  maxPlayers?: number;
}

export type OnPlayerJoinCallback = (player: Player) => void;
export type OnPlayerLeaveCallback = (username: string) => void;
export type OnMessageCallback = (msg: GameMessage) => void;
export type OnGameStartCallback = (data: any) => void;
export type OnStatusCallback = (status: string) => void;
export type OnHostDisconnectCallback = () => void;
export type OnSettingsUpdateCallback = (settings: SettingsUpdate) => void;

export class JanusDialogenService {
  private janus: any = null;
  private roomPlugin: any = null;
  private server: string;
  private _initPromise: Promise<void> | null = null;
  private _isInitialized: boolean = false;

  // Room state
  private currentRoomCode: string = "";
  private currentUsername: string = "";
  private isHost: boolean = false;
  private players: Map<string, Player> = new Map();

  private processedMessages = new Map<string, number>();
  private readonly MESSAGE_TTL = 60000; // 1 minute
  private cleanupInterval: any = null;
  private participantsDebounceTimer: any = null;
  private pendingParticipants: any[] = [];

  // Callbacks
  private _onPlayerJoinCallbacks: OnPlayerJoinCallback[] = [];
  private _onPlayerLeaveCallbacks: OnPlayerLeaveCallback[] = [];
  private _onMessageCallbacks: OnMessageCallback[] = [];
  private _onGameStartCallbacks: OnGameStartCallback[] = [];
  private _onStatusCallbacks: OnStatusCallback[] = [];
  private _onHostDisconnectCallbacks: OnHostDisconnectCallback[] = [];
  private _onSettingsUpdateCallbacks: OnSettingsUpdateCallback[] = [];

  constructor(serverUrl: string) {
    this.server = serverUrl;

    // ✅ NEW: Auto-cleanup old messages every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this._cleanupOldMessages();
    }, 30000);
  }

  // ==================== CALLBACKS ====================

  onPlayerJoin(cb: OnPlayerJoinCallback) {
    if (!this._onPlayerJoinCallbacks.includes(cb)) {
      this._onPlayerJoinCallbacks.push(cb);
    }
  }

  onPlayerLeave(cb: OnPlayerLeaveCallback) {
    if (!this._onPlayerLeaveCallbacks.includes(cb)) {
      this._onPlayerLeaveCallbacks.push(cb);
    }
  }

  onMessage(cb: OnMessageCallback) {
    if (!this._onMessageCallbacks.includes(cb)) {
      this._onMessageCallbacks.push(cb);
    }
  }

  onGameStart(cb: OnGameStartCallback) {
    if (!this._onGameStartCallbacks.includes(cb)) {
      this._onGameStartCallbacks.push(cb);
    }
  }

  onStatus(cb: OnStatusCallback) {
    if (!this._onStatusCallbacks.includes(cb)) {
      this._onStatusCallbacks.push(cb);
    }
  }

  onHostDisconnect(cb: OnHostDisconnectCallback) {
    if (!this._onHostDisconnectCallbacks.includes(cb)) {
      this._onHostDisconnectCallbacks.push(cb);
    }
  }

  onSettingsUpdate(cb: OnSettingsUpdateCallback) {
    if (!this._onSettingsUpdateCallbacks.includes(cb)) {
      this._onSettingsUpdateCallbacks.push(cb);
    }
  }

  private _triggerPlayerJoin(player: Player) {
    this._onPlayerJoinCallbacks.forEach((cb) => cb(player));
  }

  private _triggerPlayerLeave(username: string) {
    this._onPlayerLeaveCallbacks.forEach((cb) => cb(username));
  }

  private _triggerMessage(msg: GameMessage) {
    this._onMessageCallbacks.forEach((cb) => cb(msg));
  }

  private _triggerGameStart(data: any) {
    this._onGameStartCallbacks.forEach((cb) => cb(data));
  }

  private _triggerStatus(status: string) {
    this._onStatusCallbacks.forEach((cb) => cb(status));
  }

  private _triggerHostDisconnect() {
    this._onHostDisconnectCallbacks.forEach((cb) => cb());
  }

  private _triggerSettingsUpdate(settings: SettingsUpdate) {
    this._onSettingsUpdateCallbacks.forEach((cb) => cb(settings));
  }
  private _cleanupOldMessages() {
    const now = Date.now();
    let cleaned = 0;

    for (const [msgId, timestamp] of this.processedMessages.entries()) {
      if (now - timestamp > this.MESSAGE_TTL) {
        this.processedMessages.delete(msgId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[JanusDialogen] 🧹 Cleaned ${cleaned} old messages`);
    }
  }

  // ==================== INITIALIZATION ====================

  async init() {
    // ✅ CRITICAL: Check browser environment
    if (typeof window === "undefined") {
      console.warn("[JanusDialogen] Server environment detected → skip init");
      return;
    }

    // ✅ NEW: Prevent multiple simultaneous inits
    if (this._isInitialized && this.janus) {
      console.log("[JanusDialogen] Already initialized, skipping...");
      return;
    }

    // ✅ NEW: If init in progress, wait for it
    if (initializationPromise) {
      console.log("[JanusDialogen] Init in progress, waiting...");
      return initializationPromise;
    }

    // ✅ NEW: Create promise and store globally
    initializationPromise = this._doInit();

    try {
      await initializationPromise;
    } finally {
      initializationPromise = null;
    }
  }

  // ✅ NEW METHOD: Add after init()
  private async _doInit() {
    // ✅ PINDAHKAN SEMUA ISI init() LAMA KE SINI
    console.log("[JanusDialogen] 🚀 Initializing Janus...");

    const J = await loadJanus();
    if (!J) {
      console.error("[JanusDialogen] ❌ Failed to load Janus library");
      throw new Error("Janus library not available");
    }

    return new Promise<void>((resolve, reject) => {
      J.init({
        debug: false,
        callback: () => {
          console.log("[JanusDialogen] Janus library initialized");

          this.janus = new J({
            server: this.server,
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
            success: () => {
              console.log("[JanusDialogen] ✅ Janus session created");
              this._isInitialized = true;
              this._triggerStatus("Connected to Janus");
              resolve();
            },
            error: (err: any) => {
              console.error("[JanusDialogen] ❌ Session creation failed", err);
              this._isInitialized = false;
              reject(err);
            },
            destroyed: () => {
              console.log("[JanusDialogen] Session destroyed");
              this.janus = null;
              this._isInitialized = false;
            },
          });
        },
      });
    });
  }

  // ==================== ROOM MANAGEMENT ====================

  async createRoom(roomCode: string, username: string): Promise<void> {
    // ✅ Guard: browser only
    if (typeof window === "undefined") {
      throw new Error(
        "[JanusDialogen] Cannot create room in server environment"
      );
    }

    if (!this.janus) throw new Error("[JanusDialogen] Janus not initialized");
    if (this.roomPlugin) {
      console.warn("[JanusDialogen] Room already exists, leaving first...");
      await this.leaveRoom();
    }

    this.currentRoomCode = roomCode;
    this.currentUsername = username;
    this.isHost = true;

    console.log(`[JanusDialogen] Creating room ${roomCode} as ${username}`);
    this._triggerStatus("Creating room...");

    return new Promise((resolve, reject) => {
      const roomId = this._generateRoomId(roomCode);

      this.janus.attach({
        plugin: "janus.plugin.textroom",
        opaqueId: `dialogen-${roomCode}-${Date.now()}`,

        success: (handle: any) => {
          console.log("[JanusDialogen] ✅ Plugin attached");
          this.roomPlugin = handle;

          handle._meta = {
            roomId,
            roomCode,
            username,
            isHost: true,
            joined: false,
            setupSent: false,
          };

          console.log("[JanusDialogen] Sending setup request...");
          handle._meta.setupSent = true;
          handle.send({
            message: { request: "setup" },
          });
        },

        error: (err: any) => {
          console.error("[JanusDialogen] Attach failed", err);
          reject(err);
        },

        ondataopen: () => {
          console.log("[JanusDialogen] ⚡ Data channel opened");
          this._createJanusRoom(this.roomPlugin, roomId, roomCode);
        },

        ondata: (raw: string) => {
          this._handleDataMessage(raw, this.roomPlugin, resolve, reject);
        },

        onmessage: (msg: any, jsep?: any) => {
          console.log("[JanusDialogen] Plugin message:", msg);

          if (jsep) {
            console.log(
              "[JanusDialogen] Received JSEP from server, creating answer..."
            );
            this.roomPlugin.createAnswer({
              jsep,
              tracks: [{ type: "data" }],
              success: (answer: any) => {
                console.log("[JanusDialogen] Sending answer");
                this.roomPlugin.send({
                  message: { request: "ack" },
                  jsep: answer,
                });
              },
              error: (err: any) => {
                console.error("[JanusDialogen] Answer error", err);
                reject(err);
              },
            });
          }
        },

        oncleanup: () => {
          console.log("[JanusDialogen] Cleanup");
        },
      });
    });
  }

  private _createJanusRoom(handle: any, roomId: number, roomCode: string) {
    if (handle._meta.roomCreationSent) {
      console.log("[JanusDialogen] Room creation already sent, skipping...");
      return;
    }

    handle._meta.roomCreationSent = true;
    console.log("[JanusDialogen] Sending room creation request...");

    // ✅ Guard: Check if data channel is available
    if (!handle.data) {
      console.error("[JanusDialogen] Data channel not available");
      return;
    }

    handle.data({
      text: JSON.stringify({
        textroom: "create",
        room: roomId,
        description: `Dialogen ${roomCode}`,
        permanent: false,
        is_private: false,
        transaction: this._randomString(12),
      }),
    });
  }

  async joinRoom(roomCode: string, username: string): Promise<void> {
    // ✅ Guard: browser only
    if (typeof window === "undefined") {
      throw new Error("[JanusDialogen] Cannot join room in server environment");
    }

    if (!this.janus) throw new Error("[JanusDialogen] Janus not initialized");
    if (this.roomPlugin) {
      console.warn("[JanusDialogen] Room already exists, leaving first...");
      await this.leaveRoom();
    }

    this.currentRoomCode = roomCode;
    this.currentUsername = username;
    this.isHost = false;

    console.log(`[JanusDialogen] Joining room ${roomCode} as ${username}`);
    this._triggerStatus("Joining room...");

    return new Promise((resolve, reject) => {
      const roomId = this._generateRoomId(roomCode);

      this.janus.attach({
        plugin: "janus.plugin.textroom",
        opaqueId: `dialogen-${roomCode}-${Date.now()}`,

        success: (handle: any) => {
          console.log("[JanusDialogen] ✅ Plugin attached (guest)");
          this.roomPlugin = handle;

          handle._meta = {
            roomId,
            roomCode,
            username,
            isHost: false,
            joined: false,
            setupSent: false,
          };

          console.log("[JanusDialogen] Sending setup request (guest)...");
          handle._meta.setupSent = true;
          handle.send({
            message: { request: "setup" },
          });
        },

        error: (err: any) => {
          console.error("[JanusDialogen] Attach failed", err);
          reject(err);
        },

        ondataopen: () => {
          console.log("[JanusDialogen] ⚡ Data channel opened (guest)");
          this._joinJanusRoom(this.roomPlugin, roomId, username);
        },

        ondata: (raw: string) => {
          this._handleDataMessage(raw, this.roomPlugin, resolve, reject);
        },

        onmessage: (msg: any, jsep?: any) => {
          console.log("[JanusDialogen] Plugin message (guest):", msg);

          if (jsep) {
            console.log(
              "[JanusDialogen] Received JSEP from server (guest), creating answer..."
            );
            this.roomPlugin.createAnswer({
              jsep,
              tracks: [{ type: "data" }],
              success: (answer: any) => {
                console.log("[JanusDialogen] Sending answer (guest)");
                this.roomPlugin.send({
                  message: { request: "ack" },
                  jsep: answer,
                });
              },
              error: (err: any) => {
                console.error("[JanusDialogen] Answer error (guest)", err);
                reject(err);
              },
            });
          }
        },
      });
    });
  }

  private _joinJanusRoom(handle: any, roomId: number, username: string) {
    if (handle._meta.joinSent) {
      console.log("[JanusDialogen] Join already sent, skipping...");
      return;
    }

    handle._meta.joinSent = true;
    console.log("[JanusDialogen] Sending join request...");

    // ✅ Guard: Check if data channel is available
    if (!handle.data) {
      console.error("[JanusDialogen] Data channel not available");
      return;
    }

    handle.data({
      text: JSON.stringify({
        textroom: "join",
        room: roomId,
        username: `${username}_${Date.now()}`,
        display: username,
        transaction: this._randomString(12),
      }),
    });
  }

  requestParticipants(): void {
    if (!this.roomPlugin || !this.roomPlugin._meta?.joined) {
      console.warn(
        "[JanusDialogen] Not joined yet, cannot request participants"
      );
      return;
    }

    console.log("[JanusDialogen] Requesting participants list...");

    // ✅ Guard
    if (!this.roomPlugin.data) return;

    this.roomPlugin.data({
      text: JSON.stringify({
        textroom: "listparticipants",
        room: this.roomPlugin._meta.roomId,
        transaction: this._randomString(12),
      }),
    });
  }

  // ==================== STATUS CHECKS ====================

  isInRoom(): boolean {
    return this.roomPlugin !== null && this.roomPlugin._meta?.joined === true;
  }

  hasActivePlugin(): boolean {
    return this.roomPlugin !== null;
  }

  getRoomInfo(): {
    roomCode: string;
    username: string;
    isHost: boolean;
  } | null {
    if (!this.roomPlugin || !this.roomPlugin._meta?.joined) {
      return null;
    }

    return {
      roomCode: this.currentRoomCode,
      username: this.currentUsername,
      isHost: this.isHost,
    };
  }

  // ==================== MESSAGE HANDLING ====================

  private _extractDisplayName(username: string, display?: string): string {
    if (display) return display;
    const match = username.match(/^(.+)_\d+$/);
    return match && match[1] ? match[1] : username;
  }

  private _handleDataMessage(
    raw: string,
    handle: any,
    resolve?: any,
    reject?: any
  ) {
    try {
      const data = JSON.parse(raw);

      const msgId = `${data.textroom || "unknown"}_${
        data.transaction || Date.now()
      }_${data.room || ""}_${data.username || ""}`;

      if (this.processedMessages.has(msgId)) {
        console.log("[JanusDialogen] 🚫 SKIP DUPLICATE");
        return;
      }

      this.processedMessages.set(msgId, Date.now());

      console.log(`[JanusDialogen] ✅ PROCESSING: ${data.textroom}`);

      const meta = handle._meta;

      // Handle participants list
      if (
        data.participants &&
        Array.isArray(data.participants) &&
        !data.textroom
      ) {
        console.log("[JanusDialogen] 📋 Queueing participants...");

        // ✅ NEW: Debounce logic
        if (this.participantsDebounceTimer) {
          clearTimeout(this.participantsDebounceTimer);
        }

        this.pendingParticipants = data.participants;

        this.participantsDebounceTimer = setTimeout(() => {
          this._processParticipantsBatch(this.pendingParticipants, meta);
          this.pendingParticipants = [];
          this.participantsDebounceTimer = null;
        }, 300);

        return;
      }

      // Handle room created
      if (data.textroom === "success" && data.room && !meta.roomCreated) {
        meta.roomCreated = true;
        console.log("[JanusDialogen] ✅ Room created, joining...");
        this._triggerStatus("Room created, joining...");

        handle.data({
          text: JSON.stringify({
            textroom: "join",
            room: data.room,
            username: `${meta.username}_${Date.now()}`,
            display: meta.username,
            transaction: this._randomString(12),
          }),
        });
        return;
      }

      // Handle joined (success with participants)
      if (
        data.textroom === "success" &&
        data.participants !== undefined &&
        !meta.joined
      ) {
        meta.joined = true;
        console.log("[JanusDialogen] ✅ Joined room via success event");

        if (!this.players.has(meta.username)) {
          const selfPlayer: Player = {
            username: meta.username,
            isHost: meta.isHost,
            joined_at: new Date().toISOString(),
          };
          this.players.set(meta.username, selfPlayer);
          this._triggerPlayerJoin(selfPlayer);
          console.log(`[JanusDialogen] ➕ Added self: ${meta.username}`);
        }

        this._triggerStatus(`Joined room ${meta.roomCode}`);

        if (resolve) resolve();
        return;
      }

      // Handle joined event
      if (data.textroom === "joined" && !meta.joined) {
        meta.joined = true;
        console.log("[JanusDialogen] ✅ Joined via joined event");

        if (!this.players.has(meta.username)) {
          const selfPlayer: Player = {
            username: meta.username,
            isHost: meta.isHost,
            joined_at: new Date().toISOString(),
          };
          this.players.set(meta.username, selfPlayer);
          this._triggerStatus(`Joined room ${meta.roomCode}`);
          console.log(
            `[JanusDialogen] ➕ Added self (joined event): ${meta.username}`
          );
        }

        if (resolve) resolve();
        return;
      }

      // Handle other join
      if (data.textroom === "join") {
        const displayName = this._extractDisplayName(
          data.username,
          data.display
        );

        if (displayName === meta.username) {
          console.log("[JanusDialogen] ⏭️ Skipping self-join");
          return;
        }

        if (this.players.has(displayName)) {
          console.log(
            `[JanusDialogen] ⏭️ Player already exists: ${displayName}`
          );
          return;
        }

        const player: Player = {
          username: displayName,
          isHost: false,
          joined_at: new Date().toISOString(),
        };
        this.players.set(displayName, player);
        this._triggerPlayerJoin(player);
        console.log(`[JanusDialogen] ➕ ${displayName} joined`);
        return;
      }

      // Handle leave
      if (data.textroom === "leave") {
        const displayName = this._extractDisplayName(
          data.username,
          data.display
        );

        if (displayName) {
          const leftPlayer = this.players.get(displayName);
          const wasHost = leftPlayer?.isHost || false;

          this.players.delete(displayName);
          this._triggerPlayerLeave(displayName);

          if (wasHost && !this.isHost) {
            console.log("[JanusDialogen] ⚠️ Host disconnected");
            this._triggerHostDisconnect();
          }
        }
        return;
      }

      // Handle message
      if (data.textroom === "message") {
        let payload: any;
        try {
          payload =
            typeof data.text === "string" ? JSON.parse(data.text) : data.text;
        } catch {
          payload = { message: data.text };
        }

        const senderName = this._extractDisplayName(
          data.username || payload.sender,
          data.display
        );

        if (payload.type === "settings_update") {
          console.log(
            "[JanusDialogen] Received settings update:",
            payload.data
          );

          if (senderName === meta.username) {
            console.log("[JanusDialogen] ⏭️ Skip settings update from self");
            return;
          }

          this._triggerSettingsUpdate(payload.data);
          return;
        }

        const gameMessage: GameMessage = {
          type: payload.type || "chat",
          room_code: this.currentRoomCode,
          sender: senderName,
          message: payload.message || payload.msg || "",
          timestamp: payload.timestamp || new Date().toISOString(),
          data: payload.data,
        };

        if (
          gameMessage.type === "game_event" &&
          payload.event === "start_game"
        ) {
          this._triggerGameStart(payload.data);
        } else {
          this._triggerMessage(gameMessage);
        }
        return;
      }

      // Handle error
      if (data.textroom === "error") {
        console.error("[JanusDialogen] ❌ Error:", data.error);
        this._triggerStatus(`Error: ${data.error}`);
        if (reject && data.error_code !== 426) {
          reject(new Error(data.error));
        }
        return;
      }
    } catch (err) {
      console.error("[JanusDialogen] Parse error:", err);
    }
  }

  private _processParticipantsBatch(participants: any[], meta: any) {
    if (meta.participantsProcessed) {
      console.log("[JanusDialogen] ⏭️ Already processed, skip");
      return;
    }

    meta.participantsProcessed = true;

    console.log(
      `[JanusDialogen] 📋 Processing ${participants.length} participants (batched)`
    );

    // ✅ Use requestAnimationFrame to avoid blocking UI
    requestAnimationFrame(() => {
      const sorted = [...participants].sort((a, b) => {
        const getTimestamp = (username: string) => {
          const match = username.match(/_(\d+)$/);
          return match && match[1] ? parseInt(match[1]) : 0;
        };
        return getTimestamp(a.username) - getTimestamp(b.username);
      });

      sorted.forEach((p: any, index: number) => {
        const displayName = this._extractDisplayName(p.username, p.display);

        if (displayName === meta.username || this.players.has(displayName)) {
          return;
        }

        const player: Player = {
          username: displayName,
          isHost: index === 0,
          joined_at: new Date().toISOString(),
        };

        this.players.set(displayName, player);
        this._triggerPlayerJoin(player);
      });
    });
  }

  // ==================== SEND MESSAGES ====================

  sendMessage(message: string) {
    if (!this.roomPlugin || !this.roomPlugin._meta?.joined) {
      console.warn("[JanusDialogen] Not joined yet");
      return false;
    }

    // ✅ Guard
    if (!this.roomPlugin.data) return false;

    const payload = {
      type: "chat",
      sender: this.currentUsername,
      message,
      timestamp: new Date().toISOString(),
    };

    this.roomPlugin.data({
      text: JSON.stringify({
        textroom: "message",
        room: this.roomPlugin._meta.roomId,
        text: JSON.stringify(payload),
        transaction: this._randomString(12),
      }),
    });

    return true;
  }

  broadcastGameStart(gameSettings: any) {
    if (!this.isHost) {
      console.warn("[JanusDialogen] Only host can start");
      return false;
    }

    if (!this.roomPlugin || !this.roomPlugin._meta?.joined) {
      console.warn("[JanusDialogen] Not joined yet");
      return false;
    }

    // ✅ Guard
    if (!this.roomPlugin.data) return false;

    const payload = {
      type: "game_event",
      event: "start_game",
      sender: this.currentUsername,
      message: "Game started!",
      timestamp: new Date().toISOString(),
      data: gameSettings,
    };

    this.roomPlugin.data({
      text: JSON.stringify({
        textroom: "message",
        room: this.roomPlugin._meta.roomId,
        text: JSON.stringify(payload),
        transaction: this._randomString(12),
      }),
    });

    return true;
  }

  broadcastSettingsUpdate(settings: SettingsUpdate) {
    if (!this.isHost) {
      console.warn("[JanusDialogen] Only host can update settings");
      return false;
    }

    if (!this.roomPlugin || !this.roomPlugin._meta?.joined) {
      console.warn("[JanusDialogen] Not joined yet");
      return false;
    }

    // ✅ Guard
    if (!this.roomPlugin.data) return false;

    const payload = {
      type: "settings_update",
      sender: this.currentUsername,
      timestamp: new Date().toISOString(),
      data: settings,
    };

    console.log("[JanusDialogen] Broadcasting settings update:", settings);

    this.roomPlugin.data({
      text: JSON.stringify({
        textroom: "message",
        room: this.roomPlugin._meta.roomId,
        text: JSON.stringify(payload),
        transaction: this._randomString(12),
      }),
    });

    return true;
  }

  // ==================== UTILITIES ====================

  private _generateRoomId(roomCode: string): number {
    let hash = 0;
    for (let i = 0; i < roomCode.length; i++) {
      hash = (hash << 5) - hash + roomCode.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000000000;
  }

  private _randomString(length: number): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getCurrentRoom(): string {
    return this.currentRoomCode;
  }

  getCurrentUsername(): string {
    return this.currentUsername;
  }

  isRoomHost(): boolean {
    return this.isHost;
  }

  // ==================== CLEANUP ====================

  async leaveRoom() {
    if (!this.roomPlugin) return;

    console.log("[JanusDialogen] Leaving room...");

    if (this.roomPlugin._meta?.joined && this.roomPlugin.data) {
      try {
        this.roomPlugin.data({
          text: JSON.stringify({
            textroom: "leave",
            room: this.roomPlugin._meta.roomId,
            transaction: this._randomString(12),
          }),
        });
      } catch (err) {
        console.warn("[JanusDialogen] Leave message error:", err);
      }
    }

    try {
      await new Promise<void>((resolve) => {
        this.roomPlugin.detach({
          success: () => resolve(),
          error: () => resolve(),
        });
      });
    } catch (err) {
      console.warn("[JanusDialogen] Detach warning:", err);
    }

    this.roomPlugin = null;
    this.players.clear();
    this.processedMessages.clear();

    this.currentRoomCode = "";
    this.currentUsername = "";
    this.isHost = false;
  }

  async destroy() {
    console.log("[JanusDialogen] Destroying...");

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.processedMessages.clear();

    await this.leaveRoom();

    if (this.janus) {
      try {
        await new Promise<void>((resolve) => {
          this.janus.destroy({
            cleanupHandles: true,
            success: () => resolve(),
            error: () => resolve(),
          });
        });
      } catch (err) {
        console.warn("[JanusDialogen] Destroy warning:", err);
      }
      this.janus = null;
      this._isInitialized = false;
    }

    this._onPlayerJoinCallbacks = [];
    this._onPlayerLeaveCallbacks = [];
    this._onMessageCallbacks = [];
    this._onGameStartCallbacks = [];
    this._onStatusCallbacks = [];
    this._onHostDisconnectCallbacks = [];
    this._onSettingsUpdateCallbacks = [];
  }
}
