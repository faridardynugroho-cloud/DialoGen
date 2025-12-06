/* eslint-disable @typescript-eslint/no-explicit-any */
import Janus from "janus-gateway";
import adapter from "webrtc-adapter";
(window as any).adapter = adapter;

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

export type OnPlayerJoinCallback = (player: Player) => void;
export type OnPlayerLeaveCallback = (username: string) => void;
export type OnMessageCallback = (msg: GameMessage) => void;
export type OnGameStartCallback = (data: any) => void;
export type OnStatusCallback = (status: string) => void;
export type OnHostDisconnectCallback = () => void;

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

  // Callbacks
  private _onPlayerJoinCallbacks: OnPlayerJoinCallback[] = [];
  private _onPlayerLeaveCallbacks: OnPlayerLeaveCallback[] = [];
  private _onMessageCallbacks: OnMessageCallback[] = [];
  private _onGameStartCallbacks: OnGameStartCallback[] = [];
  private _onStatusCallbacks: OnStatusCallback[] = [];
  private _onHostDisconnectCallbacks: OnHostDisconnectCallback[] = [];

  constructor(serverUrl: string) {
    this.server = serverUrl;
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

  // ==================== INITIALIZATION ====================

  async init() {
    // Jika sudah initialized, return immediately
    if (this._isInitialized && this.janus) {
      console.log("[JanusDialogen] Already initialized, skipping...");
      return;
    }

    // Jika sedang dalam proses init, tunggu
    if (this._initPromise) {
      console.log("[JanusDialogen] Waiting for ongoing init...");
      return this._initPromise;
    }

    this._initPromise = new Promise<void>((resolve, reject) => {
      console.log("[JanusDialogen] 🚀 Initializing Janus...");

      Janus.init({
        callback: () => {
          console.log("[JanusDialogen] Janus library initialized");

          this.janus = new Janus({
            server: this.server,
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            success: () => {
              console.log("[JanusDialogen] ✅ Janus session created");
              this._isInitialized = true;
              this._triggerStatus("Connected to Janus");
              this._initPromise = null;
              resolve();
            },
            error: (err) => {
              console.error("[JanusDialogen] ❌ Session creation failed", err);
              this._initPromise = null;
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

    return this._initPromise;
  }

  // ==================== ROOM MANAGEMENT ====================

  /**
   * Create a new room (Host)
   */
  async createRoom(roomCode: string, username: string): Promise<void> {
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

          // Metadata untuk tracking state
          handle._meta = {
            roomId,
            roomCode,
            username,
            isHost: true,
            joined: false,
            setupSent: false, // ✅ Track apakah setup sudah dikirim
          };

          // Langsung kirim setup request
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

        // Handle WebRTC data channel
        ondataopen: () => {
          console.log("[JanusDialogen] ⚡ Data channel opened");

          // Setelah data channel ready, create room
          this._createJanusRoom(this.roomPlugin, roomId, roomCode);
        },

        ondata: (raw: string) => {
          this._handleDataMessage(raw, this.roomPlugin, resolve, reject);
        },

        onmessage: (msg: any, jsep?: any) => {
          console.log("[JanusDialogen] Plugin message:", msg);

          // ✅ PERBAIKAN: Handle JSEP dari server (server kirim offer)
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

          // ✅ HAPUS bagian create offer - tidak perlu!
          // Server sudah kirim offer lewat JSEP, kita hanya perlu answer
        },

        oncleanup: () => {
          console.log("[JanusDialogen] Cleanup");
        },
      });
    });
  }
  /**
   * Helper: Create room di Janus setelah data channel ready
   */
  private _createJanusRoom(handle: any, roomId: number, roomCode: string) {
    if (handle._meta.roomCreationSent) {
      console.log("[JanusDialogen] Room creation already sent, skipping...");
      return;
    }

    handle._meta.roomCreationSent = true;
    console.log("[JanusDialogen] Sending room creation request...");

    handle.data({
      text: JSON.stringify({
        textroom: "create",
        room: roomId,
        description: `Dialogen ${roomCode}`,
        permanent: false,
        is_private: false,
        transaction: Janus.randomString(12),
      }),
    });
  }

  /**
   * Join existing room (Guest)
   */
  async joinRoom(roomCode: string, username: string): Promise<void> {
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

          // Langsung kirim setup request
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

          // Setelah data channel ready, join room
          this._joinJanusRoom(this.roomPlugin, roomId, username);
        },

        ondata: (raw: string) => {
          this._handleDataMessage(raw, this.roomPlugin, resolve, reject);
        },

        onmessage: (msg: any, jsep?: any) => {
          console.log("[JanusDialogen] Plugin message (guest):", msg);

          // ✅ PERBAIKAN: Hanya handle JSEP dari server
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

          // ✅ HAPUS bagian create offer - tidak perlu!
        },
      });
    });
  }
  /**
   * Helper: Join room di Janus setelah data channel ready
   */
  private _joinJanusRoom(handle: any, roomId: number, username: string) {
    if (handle._meta.joinSent) {
      console.log("[JanusDialogen] Join already sent, skipping...");
      return;
    }

    handle._meta.joinSent = true;
    console.log("[JanusDialogen] Sending join request...");

    handle.data({
      text: JSON.stringify({
        textroom: "join",
        room: roomId,
        username: `${username}_${Date.now()}`,
        display: username,
        transaction: Janus.randomString(12),
      }),
    });
  }

  /**
   * Request list of participants in current room
   */
  requestParticipants(): void {
    if (!this.roomPlugin || !this.roomPlugin._meta?.joined) {
      console.warn(
        "[JanusDialogen] Not joined yet, cannot request participants"
      );
      return;
    }

    console.log("[JanusDialogen] Requesting participants list...");

    this.roomPlugin.data({
      text: JSON.stringify({
        textroom: "listparticipants",
        room: this.roomPlugin._meta.roomId,
        transaction: Janus.randomString(12),
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
    // Jika display ada, gunakan itu
    if (display) return display;

    // Jika tidak, extract dari username format: username_timestamp
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
      console.log("[JanusDialogen] 📨 Received:", data.textroom, data);

      const meta = handle._meta;

      // ✅ PERBAIKAN BARU: Handle participants list (tidak ada field textroom!)
      if (
        data.participants &&
        Array.isArray(data.participants) &&
        !data.textroom
      ) {
        const sortedParticipants = [...data.participants].sort((a, b) => {
          const getTimestamp = (username: string) => {
            const match = username.match(/_(\d+)$/);
            return match && match[1] ? parseInt(match[1]) : 0;
          };
          return getTimestamp(a.username) - getTimestamp(b.username);
        });

        sortedParticipants.forEach((p: any, index: number) => {
          const displayName = this._extractDisplayName(p.username, p.display);

          // Skip diri sendiri
          if (displayName === meta.username) {
            console.log("[JanusDialogen] Skipping self in participants list");
            return;
          }

          const isParticipantHost = index === 0;

          const player: Player = {
            username: displayName,
            isHost: isParticipantHost,
            joined_at: new Date().toISOString(),
          };

          if (!this.players.has(displayName)) {
            this.players.set(displayName, player);
            this._triggerPlayerJoin(player);
            console.log(
              `[JanusDialogen] 👤 Added existing participant: ${displayName} (host: ${isParticipantHost})`
            );
          }
        });
        return;
      }
      // ✅ PERBAIKAN: Handle 'success' response dari room creation
      if (data.textroom === "success" && data.room && !meta.roomCreated) {
        meta.roomCreated = true;
        console.log(
          "[JanusDialogen] ✅ Room created successfully! Now joining..."
        );
        this._triggerStatus("Room created, joining...");

        // Langsung join room yang baru dibuat
        handle.data({
          text: JSON.stringify({
            textroom: "join",
            room: data.room,
            username: `${meta.username}_${Date.now()}`,
            display: meta.username,
            transaction: Janus.randomString(12),
          }),
        });
        return;
      }

      // ✅ PERBAIKAN BARU: Handle 'success' response dari join (yang berisi participants)
      if (
        data.textroom === "success" &&
        data.participants !== undefined &&
        !meta.joined
      ) {
        meta.joined = true;
        console.log(
          "[JanusDialogen] ✅ Successfully joined room via success event!"
        );

        // Add self to players
        const selfPlayer: Player = {
          username: meta.username,
          isHost: meta.isHost,
          joined_at: new Date().toISOString(),
        };
        this.players.set(meta.username, selfPlayer);

        // ✅ PERBAIKAN: Trigger callback untuk notify UI
        this._triggerPlayerJoin(selfPlayer);

        this._triggerStatus(`Joined room ${meta.roomCode}`);

        if (resolve) {
          console.log("[JanusDialogen] Resolving promise...");
          resolve();
        }
        return;
      }

      // ✅ TAMBAHAN: Handle 'success' setelah CREATE room (Host)
      if (
        data.textroom === "success" &&
        data.room &&
        !meta.roomCreated &&
        meta.isHost // ✅ Pastikan ini untuk host
      ) {
        meta.roomCreated = true;
        console.log(
          "[JanusDialogen] ✅ Room created successfully! Now joining..."
        );
        this._triggerStatus("Room created, joining...");

        // Langsung join room yang baru dibuat
        handle.data({
          text: JSON.stringify({
            textroom: "join",
            room: data.room,
            username: `${meta.username}_${Date.now()}`,
            display: meta.username,
            transaction: Janus.randomString(12),
          }),
        });
        return;
      }

      // ✅ Handle 'joined' event (fallback jika server kirim event ini)
      if (data.textroom === "joined") {
        meta.joined = true;
        console.log(
          "[JanusDialogen] ✅ Successfully joined room via joined event!"
        );

        // Add self to players dengan isHost yang benar dari meta
        const selfPlayer: Player = {
          username: meta.username,
          isHost: meta.isHost,
          joined_at: new Date().toISOString(),
        };
        this.players.set(meta.username, selfPlayer);

        this._triggerStatus(`Joined room ${meta.roomCode}`);

        // ✅ Resolve promise di sini
        if (resolve) {
          console.log("[JanusDialogen] Resolving promise...");
          resolve();
        }
        return;
      }

      // Handle other participants joining
      if (data.textroom === "join") {
        const displayName = this._extractDisplayName(
          data.username,
          data.display
        );
        const rawUsername = data.username;

        // Skip diri sendiri
        if (displayName === meta.username) {
          console.log("[JanusDialogen] Skipping self-join event");
          return;
        }

        if (displayName) {
          const player: Player = {
            username: displayName,
            isHost: false,
            joined_at: new Date().toISOString(),
          };
          this.players.set(displayName, player);
          this._triggerPlayerJoin(player);
          console.log(`[JanusDialogen] 👤 ${displayName} joined`);
        }
        return;
      }

      // Player left event
      if (data.textroom === "leave") {
        const displayName = this._extractDisplayName(
          data.username,
          data.display
        );

        if (displayName) {
          const leftPlayer = this.players.get(displayName);
          const wasHost = leftPlayer?.isHost || false;

          console.log(`[JanusDialogen] 👋 Player leaving:`, {
            rawUsername: data.username,
            displayName,
            wasHost,
            foundInMap: !!leftPlayer,
          });

          this.players.delete(displayName);
          this._triggerPlayerLeave(displayName);

          if (wasHost && !this.isHost) {
            console.log(
              "[JanusDialogen] ⚠️ Host disconnected! Room is now invalid"
            );
            this._triggerHostDisconnect();
          }
        }
        return;
      }
      // Chat message
      if (data.textroom === "message") {
        let payload: any;
        try {
          payload =
            typeof data.text === "string" ? JSON.parse(data.text) : data.text;
        } catch {
          payload = { message: data.text };
        }

        const gameMessage: GameMessage = {
          type: payload.type || "chat",
          room_code: this.currentRoomCode,
          sender: data.from || payload.sender || "Unknown",
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

      // Error
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
  // ==================== SEND MESSAGES ====================

  sendMessage(message: string) {
    if (!this.roomPlugin || !this.roomPlugin._meta?.joined) {
      console.warn("[JanusDialogen] Not joined yet");
      return false;
    }

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
        transaction: Janus.randomString(12),
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
        transaction: Janus.randomString(12),
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
    // Ensure positive number
    return Math.abs(hash) % 1000000000;
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

    if (this.roomPlugin._meta?.joined) {
      try {
        this.roomPlugin.data({
          text: JSON.stringify({
            textroom: "leave",
            room: this.roomPlugin._meta.roomId,
            transaction: Janus.randomString(12),
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
    this.currentRoomCode = "";
    this.currentUsername = "";
    this.isHost = false;
  }

  async destroy() {
    console.log("[JanusDialogen] Destroying...");

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
  }
}
