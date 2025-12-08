<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6"
  >
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
        ></div>
        <p class="text-gray-700">{{ status || "Loading..." }}</p>
      </div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="error"
      class="fixed top-5 right-5 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-right"
    >
      {{ error }}
      <button @click="error = null" class="ml-4 text-white font-bold">×</button>
    </div>

    <!-- 🔍 DEBUG PANEL - TOP RIGHT -->
    <div class="fixed top-5 left-5 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-40 max-h-96 overflow-y-auto">
      <div class="font-bold mb-2">🔍 Debug Panel</div>
      <div class="space-y-1">
        <div>Room: {{ roomCode }}</div>
        <div>User: {{ username }} ({{ isHost ? 'HOST' : 'GUEST' }})</div>
        <div>Players: {{ players.length }}</div>
        <div>Messages: {{ messages.length }}</div>
        <div>Redirecting: {{ isRedirecting }}</div>
        <hr class="my-2 border-gray-600">
        <div class="font-bold">Last 3 Messages:</div>
        <div v-for="(msg, idx) in messages.slice(-3)" :key="idx" class="pl-2 border-l-2 border-blue-500 mb-2">
          <div>Type: {{ msg.type }}</div>
          <div>Sender: {{ msg.sender }}</div>
          <div class="truncate">Message: {{ msg.message }}</div>
          <div v-if="msg.data">Data: {{ JSON.stringify(msg.data) }}</div>
        </div>
      </div>
    </div>

    <div class="relative z-10 max-w-4xl mx-auto">
      <!-- Header with Room Code -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-4">
          {{ isHost ? "Host Lobby" : "Lobby" }}
        </h1>
        <div
          class="inline-flex items-center bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20"
        >
          <div
            class="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-300 rounded-full flex items-center justify-center mr-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
              />
            </svg>
          </div>
          <div class="text-left">
            <p class="text-gray-300 text-sm">Room Code</p>
            <p class="text-2xl font-bold text-white">{{ roomCode }}</p>
          </div>

          <button
            v-if="isHost"
            @click="copyRoomCode"
            class="ml-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
        <div v-if="showCopyNotification" class="mt-2 text-green-400 text-sm">
          Room code copied!
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Players List -->
        <div
          class="md:col-span-2 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20"
        >
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Players</h2>
            <div
              class="bg-white bg-opacity-20 rounded-full px-3 py-1 text-white text-sm"
            >
              {{ players.length }}/{{ maxPlayers }}
            </div>
          </div>

          <ul class="space-y-3">
            <li
              v-for="player in players"
              :key="player.username"
              class="bg-white bg-opacity-10 backdrop-filter backdrop-blur rounded-xl p-4 flex items-center justify-between"
            >
              <div class="flex items-center">
                <div class="relative mr-4">
                  <div
                    class="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center shadow-md"
                  >
                    <span class="text-white font-bold">{{
                      player.username.charAt(0).toUpperCase()
                    }}</span>
                  </div>
                  <div
                    v-if="player.isHost"
                    class="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                  </div>
                  <div
                    v-else
                    class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center border-2 border-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-white font-medium">{{ player.username }}</p>
                  <p class="text-gray-300 text-sm">
                    {{ player.isHost ? "Host" : "Player" }}
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <div
                  class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"
                ></div>
                <span class="text-green-400 text-sm">Online</span>
              </div>
            </li>

            <li
              v-for="n in maxPlayers - players.length"
              :key="'empty-' + n"
              class="bg-white bg-opacity-5 border-2 border-dashed border-white border-opacity-20 rounded-xl p-4 flex items-center justify-center"
            >
              <p class="text-gray-400">Waiting for player...</p>
            </li>
          </ul>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <template v-if="isHost">
            <div
              class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20"
            >
              <h3 class="text-xl font-bold text-white mb-4">Game Settings</h3>
              <div class="space-y-4">
                <div>
                  <label class="text-gray-300 text-sm block mb-2"
                    >Game kategori</label
                  >
                  <select
                    v-model="gameSettings.mode"
                    class="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="bahasa">Bahasa</option>
                    <option value="pakaian-adat">Pakaian Adat</option>
                    <option value="rumah-adat">Rumah Adat</option>
                    <option value="semua-kategori">Semua Kategori</option>
                  </select>
                </div>
                <div>
                  <label class="text-gray-300 text-sm block mb-2"
                    >Time Limit</label
                  >
                  <select
                    v-model="gameSettings.timeLimit"
                    class="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="1">1 minutes</option>
                    <option value="2">2 minutes</option>
                    <option value="3">3 minutes</option>
                    <option value="unlimited">No Limit</option>
                  </select>
                </div>
                <div>
                  <label class="text-gray-300 text-sm block mb-2"
                    >Max Players</label
                  >
                  <div class="flex items-center">
                    <button
                      @click="decreaseMaxPlayers"
                      class="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white hover:bg-opacity-30"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <span class="mx-4 text-white font-medium">{{
                      maxPlayers
                    }}</span>
                    <button
                      @click="increaseMaxPlayers"
                      class="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white hover:bg-opacity-30"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              @click="handleStartGame"
              :disabled="players.length < 2"
              class="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105"
            >
              <span class="flex items-center justify-center">
                Start Game
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>

            <div
              v-if="players.length < 2"
              class="text-center text-yellow-300 text-sm"
            >
              At least 2 players are required
            </div>
          </template>

          <template v-else>
            <div
              class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20"
            >
              <h3 class="text-xl font-bold text-white mb-4">Room Info</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-300">Room Code</span>
                  <span class="text-white font-medium">{{ roomCode }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Game Mode</span>
                  <span class="text-white font-medium">{{
                    gameSettings.mode || "Conversation"
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Players</span>
                  <span class="text-white font-medium"
                    >{{ players.length }}/{{ maxPlayers }}</span
                  >
                </div>
              </div>
            </div>

            <div
              class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20"
            >
              <div class="flex flex-col items-center justify-center">
                <div class="relative mb-4">
                  <div
                    class="w-16 h-16 border-4 border-white border-opacity-30 rounded-full"
                  ></div>
                  <div
                    class="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"
                  ></div>
                </div>
                <p class="text-white text-center">
                  Waiting for host to start the game...
                </p>
              </div>
            </div>
          </template>

          <button
            @click="handleLeaveRoom"
            class="w-full py-3 bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white rounded-xl font-medium transition-all duration-300"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useJanusRoom } from "@/composable/UseJanusRoom";

const router = useRouter();
const showCopyNotification = ref(false);
const maxPlayers = ref(5);
const isRedirecting = ref(false);

const gameSettings = ref({
  mode: "bahasa",
  timeLimit: "2",
});

const JANUS_SERVER =
  import.meta.env.VITE_JANUS_SERVER || "https://janus.cloudwego.net/janus";
const {
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
  startGame,
  leaveRoom,
  isInRoom,
  getRoomInfo,
  getPlayers,
  onHostDisconnect,
} = useJanusRoom(JANUS_SERVER);

let syncInterval: any = null;
let unregisterGuard: any = null;

onMounted(async () => {
  const savedUsername = localStorage.getItem("username");
  const savedRoomCode = localStorage.getItem("roomCode");
  const savedIsHost = localStorage.getItem("isHost") === "true";

  if (!savedUsername || !savedRoomCode) {
    router.push("/");
    return;
  }

  try {
    if (isInRoom()) {
      console.log("✅ Room already active, using existing session");
      const roomInfo = getRoomInfo();
      if (roomInfo) {
        roomCode.value = roomInfo.roomCode;
        username.value = roomInfo.username;
        isHost.value = roomInfo.isHost;
        players.value = getPlayers();
      }
      return;
    }

    if (!isConnected.value) {
      await init();
    }

    if (savedIsHost) {
      await createRoom(savedRoomCode, savedUsername);
      console.log("✅ Room created successfully");
    } else {
      await joinRoom(savedRoomCode, savedUsername);
      console.log("✅ Joined room successfully");
    }

    syncInterval = setInterval(() => {
      const updatedPlayers = getPlayers();
      if (updatedPlayers.length !== players.value.length) {
        players.value = updatedPlayers;
        console.log("[Lobby] Players synced:", updatedPlayers);
      }
    }, 2000);

  } catch (err) {
    console.error("Failed to setup room:", err);
    setTimeout(() => router.push("/"), 3000);
  }

  unregisterGuard = router.beforeEach((to, from, next) => {
    if (to.path === '/game') {
      const gameStarted = localStorage.getItem('gameStarted');
      const roomCode = localStorage.getItem('roomCode');
      
      console.log('[Lobby->Game Guard] Checking access:', {
        gameStarted,
        roomCode,
        from: from.path,
        to: to.path
      });
    }
    next();
  });
});

// ✅ ENHANCED WATCH with detailed logging
watch(messages, (newMessages) => {
  console.log("[Lobby] ==========================================");
  console.log("[Lobby] 📬 Messages array updated!");
  console.log("[Lobby] Total messages:", newMessages.length);
  console.log("[Lobby] isRedirecting:", isRedirecting.value);
  console.log("[Lobby] isHost:", isHost.value);
  
  if (isRedirecting.value) {
    console.log("[Lobby] ⚠️ Already redirecting, SKIP");
    return;
  }

  if (newMessages.length === 0) {
    console.log("[Lobby] ⚠️ No messages, SKIP");
    return;
  }
  
  const lastMsg = newMessages[newMessages.length - 1];
  console.log("[Lobby] 🔍 Last message:", JSON.stringify(lastMsg, null, 2));

  // ✅ METHOD 1: Direct game_event type
  if (lastMsg?.type === "game_event") {
    console.log("[Lobby] ✅ METHOD 1: Direct game_event detected!");
    const data = lastMsg.data || {};
    console.log("[Lobby] Event data:", data);
    
    if (data.event === "start_game") {
      console.log("[Lobby] 🎮 START GAME EVENT CONFIRMED!");
      handleRedirect(data);
      return;
    } else {
      console.log("[Lobby] ⚠️ game_event but not start_game, event:", data.event);
    }
  }

  // ✅ METHOD 2: Parse nested JSON in chat message
  if (lastMsg?.type === "chat" && lastMsg?.message) {
    console.log("[Lobby] 🔍 METHOD 2: Trying to parse chat message...");
    try {
      const parsed = JSON.parse(lastMsg.message);
      console.log("[Lobby] 📦 Parsed nested content:", JSON.stringify(parsed, null, 2));
      
      if (parsed.type === "game_event" && parsed.event === "start_game") {
        console.log("[Lobby] ✅ START GAME found in nested JSON!");
        handleRedirect(parsed.data || {});
        return;
      } else {
        console.log("[Lobby] ℹ️ Parsed but not start_game:", {
          type: parsed.type,
          event: parsed.event
        });
      }
    } catch (e) {
      console.log("[Lobby] ℹ️ Not JSON or parse failed");
    }
  }
  
  console.log("[Lobby] ⚠️ No start_game event detected in this message");
  console.log("[Lobby] ==========================================");
}, { deep: true });

function handleRedirect(data: any) {
  console.log("[Lobby] 🚀 handleRedirect called with data:", data);
  
  if (isRedirecting.value) {
    console.log("[Lobby] ❌ Already redirecting, abort");
    return;
  }

  isRedirecting.value = true;
  console.log("[Lobby] ✅ Set isRedirecting = true");

  const settings = {
    mode: data.mode || gameSettings.value.mode || "bahasa",
    timeLimit: data.timeLimit || gameSettings.value.timeLimit || "2"
  };
  
  console.log("[Lobby] 💾 Saving to localStorage:", settings);
  localStorage.setItem("gameStarted", "true");
  localStorage.setItem("gameSettings", JSON.stringify(settings));
  
  const saved = localStorage.getItem("gameStarted");
  console.log("[Lobby] ✅ Verified localStorage.gameStarted =", saved);
  
  if (syncInterval) {
    clearInterval(syncInterval);
    console.log("[Lobby] 🧹 Cleared sync interval");
  }
  
  console.log("[Lobby] 🚀 Calling router.push('/game')...");
  router.push("/game").then(() => {
    console.log("[Lobby] ✅ Router.push SUCCESS");
  }).catch(err => {
    console.error("[Lobby] ❌ Router.push FAILED:", err);
    isRedirecting.value = false;
    localStorage.removeItem("gameStarted");
    localStorage.removeItem("gameSettings");
  });
}

onUnmounted(() => {
  if (syncInterval) clearInterval(syncInterval);
  if (unregisterGuard) unregisterGuard();
  console.log("[Lobby] Component unmounted");
});

const copyRoomCode = () => {
  navigator.clipboard.writeText(roomCode.value);
  showCopyNotification.value = true;
  setTimeout(() => {
    showCopyNotification.value = false;
  }, 3000);
};

const increaseMaxPlayers = () => {
  if (maxPlayers.value < 10) {
    maxPlayers.value++;
  }
};

const decreaseMaxPlayers = () => {
  if (maxPlayers.value > players.value.length) {
    maxPlayers.value--;
  }
};

const handleStartGame = () => {
  console.log("[Lobby] ==========================================");
  console.log("[Lobby] 🎮 HOST CLICKED START GAME");
  console.log("[Lobby] Settings:", gameSettings.value);
  console.log("[Lobby] ==========================================");

  const success = startGame({
    ...gameSettings.value,
    maxPlayers: maxPlayers.value,
    startedAt: new Date().toISOString(),
  });

  if (success) {
    console.log("[Lobby] ✅ startGame() returned true");
    
    // ✅ CRITICAL FIX: Set isHost SEBELUM redirect
    localStorage.setItem('isHost', 'true');  // ✅✅✅ TAMBAHKAN INI!
    localStorage.setItem('gameStarted', 'true');
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings.value));
    
    console.log("[Lobby] ✅ Set localStorage.isHost = true");
    
    if (syncInterval) clearInterval(syncInterval);
    
    console.log("[Lobby] 🚀 HOST redirecting to /game...");
    router.push('/game');
  } else {
    console.error("[Lobby] ❌ startGame() returned false");
    error.value = "Failed to start game";
  }
};

const handleLeaveRoom = async () => {
  try {
    if (syncInterval) clearInterval(syncInterval);
    await leaveRoom();
    localStorage.removeItem("roomCode");
    localStorage.removeItem("username");
    localStorage.removeItem("isHost");
    router.push("/");
  } catch (err) {
    console.error("Failed to leave room:", err);
  }
};

onHostDisconnect(() => {
  console.log("⚠️ Host has left the room!");
  error.value = "Host has left the room. Returning to home...";
  if (syncInterval) clearInterval(syncInterval);
  setTimeout(() => {
    localStorage.removeItem("roomCode");
    localStorage.removeItem("username");
    localStorage.removeItem("isHost");
    router.push("/");
  }, 3000);
});
</script>

<style scoped>
/* Custom animations */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}

.animation-delay-600 {
  animation-delay: 0.6s;
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}

.animate-slide-in-right {
  animation: slide-in-right 0.5s ease-out;
}

/* Glassmorphism effect */
.backdrop-filter {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Custom scrollbar */
select::-webkit-scrollbar {
  width: 6px;
}

select::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

select::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

select::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
