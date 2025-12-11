<template>
  <div
    class="min-h-screen p-0"
    style="
      background: linear-gradient(
        to bottom,
        #FF0000  10%,
        #FF0000  10%,
        #f3f4f6 40%,
        #f3f4f6 100%
      );
    "
  >
    <!-- 🎉 Celebration Overlay -->
    <div
      v-if="showCelebration"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in"
    >
      <div class="text-center animate-bounce-in">
        <div class="text-9xl mb-6 animate-spin-slow">🎉</div>
        <h1 class="text-white text-6xl font-bold mb-4 animate-slide-in-up">
          Game Over!
        </h1>
        <p class="text-yellow-400 text-3xl font-bold animate-slide-in-down">
          Calculating Results...
        </p>
      </div>
      
      <!-- Confetti Effect -->
      <div class="confetti-container">
        <div v-for="i in 50" :key="i" 
             class="confetti"
             :style="{ 
               left: Math.random() * 100 + '%',
               animationDelay: Math.random() * 3 + 's',
               background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)]
             }"
        ></div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-show="!showCelebration" class="animate-fade-in-slow">
      <!-- Header -->
      <div class="relative z-10 pt-6 px-4">
        <h1 class="text-white text-center text-2xl font-bold mb-4">
          Leaderboard
        </h1>
      </div>

      <!-- Podium Section -->
      <div class="relative z-10 max-w-md mx-auto px-4">
        <div class="flex items-end justify-center">
          <!-- 2nd Place -->
          <div class="flex flex-col items-center animate-slide-in-left" style="width: 100px; animation-delay: 0.3s;">
            <div
              class="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center mb-2 animate-pop-in"
              style="animation-delay: 0.5s;"
            >
              <span class="text-white font-bold text-lg">
                {{ sortedPlayers[1] ? sortedPlayers[1].username.charAt(0).toUpperCase() : 'E' }}
              </span>
            </div>
            <p class="text-white text-xs font-medium mb-1 text-center truncate w-full">
              {{ sortedPlayers[1] ? sortedPlayers[1].username : 'Empty' }}
            </p>
            <div class="bg-indigo-900 text-white rounded-full px-3 py-1 text-xs font-bold mb-2 animate-pulse-subtle">
              {{ sortedPlayers[1] ? sortedPlayers[1].score + ' Pts' : '0 Pts' }}
            </div>
            <div
              class="bgred rounded-t-2xl w-full flex items-center justify-center text-white text-7xl font-bold animate-rise-up"
              style="height: 140px; animation-delay: 0.6s;"
            >
              2
            </div>
          </div>

          <!-- 1st Place -->
          <div class="flex flex-col items-center animate-slide-in-up" style="width: 110px; animation-delay: 0.5s;">
            <div class="text-yellow-400 text-3xl mb-2 animate-bounce-slow">👑</div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center mb-2 ring-4 ring-yellow-400 animate-pop-in"
              style="animation-delay: 0.7s;"
            >
              <span class="text-white font-bold text-xl">
                {{ sortedPlayers[0] ? sortedPlayers[0].username.charAt(0).toUpperCase() : 'E' }}
              </span>
            </div>
            <p class="text-white text-sm font-bold mb-1 text-center truncate w-full">
              {{ sortedPlayers[0] ? sortedPlayers[0].username : 'Empty' }}
            </p>
            <div class="bg-indigo-900 text-white rounded-full px-3 py-1 text-xs font-bold mb-2 animate-pulse-glow">
              {{ sortedPlayers[0] ? sortedPlayers[0].score + ' Pts' : '0 Pts' }}
            </div>
            <div
              class="rounded-t-2xl w-full flex items-center justify-center text-white text-8xl font-bold animate-rise-up"
              style="height: 180px; background: linear-gradient(to bottom, #FF0000 0%, #FF0000 40%, #f3f4f6 80%, #f3f4f6 100%); animation-delay: 0.8s;"
            >
              1
            </div>
          </div>

          <!-- 3rd Place -->
          <div class="flex flex-col items-center animate-slide-in-right" style="width: 100px; animation-delay: 0.3s;">
            <div
              class="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center mb-2 animate-pop-in"
              style="animation-delay: 0.5s;"
            >
              <span class="text-white font-bold text-lg">
                {{ sortedPlayers[2] ? sortedPlayers[2].username.charAt(0).toUpperCase() : 'E' }}
              </span>
            </div>
            <p class="text-white text-xs font-medium mb-1 text-center truncate w-full">
              {{ sortedPlayers[2] ? sortedPlayers[2].username : 'Empty' }}
            </p>
            <div class="bg-indigo-900 text-white rounded-full px-3 py-1 text-xs font-bold mb-2 animate-pulse-subtle">
              {{ sortedPlayers[2] ? sortedPlayers[2].score + ' Pts' : '0 Pts' }}
            </div>
            <div
              class="bgred rounded-t-2xl w-full flex items-center justify-center text-white text-6xl font-bold animate-rise-up"
              style="height: 120px; animation-delay: 0.6s;"
            >
              3
            </div>
          </div>
        </div>
      </div>

      <!-- Rankings List -->
      <div class="relative z-10 max-w-md mx-auto animate-slide-in-up" style="animation-delay: 1s;">
        <div
          class="bgred rounded-3xl p-4 border-8 border-indigo-900"
          style="min-height: 440px;"
        >
          <div class="space-y-3">
            <div
              v-for="(player, index) in sortedPlayers"
              :key="player.username"
              v-show="index >= 3"
              class="bg-white rounded-2xl p-4 flex items-center gap-4 animate-slide-in-right"
              :style="{ animationDelay: (1.2 + index * 0.1) + 's' }"
            >
              <div
                class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0"
              >
                {{ index + 1 }}
              </div>
              <div
                class="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <span class="text-white font-bold">
                  {{ player.username.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="flex-grow min-w-0">
                <p class="text-gray-900 font-bold truncate">{{ player.username }}</p>
                <p class="text-gray-500 text-sm">{{ player.score }} Pts</p>
              </div>
            </div>

            <!-- Empty state if less than 4 players -->
            <div
              v-if="sortedPlayers.length < 4"
              class="text-center text-white py-8"
            >
              <p class="text-lg font-medium">No more players</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex gap-4 pb-8 animate-slide-in-up" style="animation-delay: 1.5s;">
          <button
            @click="handlePlayAgain"
            v-if="isHost"
            class="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Play Again
          </button>
          <button
            @click="handleLeaveRoom"
            class="flex-1 py-4 bgred hover:bg-red-600 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>

    <!-- Audio Elements -->
    <audio ref="celebrationAudio" preload="auto">
      <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuByvLZiTYIGmm98OScTgwPUKXh8LZjHAU7k9n1yngrBSh+zPLaizsKFF+45O2nVBMJSKDh8bllHgMug8v02Ik2Bxpqvu/mnE4MD1Cl4fC2YxwGO5PZ9cp3KwUofszy2os7ChRfuOTtp1QTCkig4fG5ZR4DLoPL9NiJNgcaKr7v5pxODA9QpeHwtmMcBjuT2fXKdysFKH/M8tqLOwoUX7jk7adUEwpJoOHxuWUeAy6Dy/TYiTYHGiq+7+acTgwPUKXh8LZjHAY7k9n1yncnBSh/zPLaizsKFF+45O2nVBMKSaDh8bllHgMug8v02Ik2Bxoqvu/mnE4MD1Cl4fC2YxwGO5PZ9cp3JwUof8zy2os7ChRfuOTtp1QTCkig4fG5ZR4DLoPL9NiJNgcaKr7v5pxODA9QpeHwtmMcBjuT2fXKdycFKH/M8tqLOwoUX7jk7adUEwpIoOHxuWUeAy6Dy/TYiTYHGiu+7+acTgwPUKXh8LZjHAY7k9n1yncnBSh/zPLaizsKFF+45O2nVBMKSKDh8bllHgMug8v02Ik2Bxoqvu/mnE4MD1Cl4fC2YxwFO5PZ9cp3JwUof8zy2os7ChRfuOTtp1QTCkig4fG5ZR4DLoPL9NiJNgcaKr7v5pxODA9QpeHwtmMcBTuT2fXKdycFKH/M8tqLOwoUX7jk7adUEwpIoOHxuWUeAy6Dy/TYiTYHGiu+7+acTgwPUKXh8LZjHAU7k9n1yncnBSh/zPLaizsKFF+45O2nVBMKSKDh8bllHgMug8v02Ik2Bxoqvu/mnE4MD1Cl4fC2YxwFO5PZ9cp3JwUof8zy2os7ChRfuOTtp1QTCkig4fG5ZR4DLoPL9NiJNgcaKr7v5pxODA9QpeHwtmMcBTuT2fXKdycFKH/M8tqLOwoUX7jk7adUEwpIoOHxuWUeAy6Dy/TYiTYHGmq+7+acTgwPUKXh8LZjHAY7k9n1yncnBSh/zPLaizsKFF+45O2nVBMKSKDh8bllHgMug8v02Ik2Bxoqvu/mnE4MD1Cl4fC2YxwGO5PZ9cp3JwUof8zy2os7ChRfuOTtp1QTCkig4fG5ZR4DLoPL9NiJNgcaKr7v5pxODA9QpeHwtmMcBjuT2fXKdycFKH/M8tqLOwoUX7jk7adUEwpIoOHxuWUeAy6Dy/TYiTYHGiq+7+acTgwPUKXh8LZjHAY7k9n1yncnBQ==" type="audio/wav">
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useJanusRoom } from "@/composable/UseJanusRoom";

const router = useRouter();

const storedUsername = localStorage.getItem("username") || "";
const storedRoomCode = localStorage.getItem("roomCode") || "";

// ✅ FIX: Ambil data dari finalScores
const savedScoresRaw = localStorage.getItem("finalScores");
let savedScoresData: any = null;
let storedIsHost = false;

if (savedScoresRaw) {
  try {
    savedScoresData = JSON.parse(savedScoresRaw);
    storedIsHost = savedScoresData.isHost || false;
    console.log("[FinalScore] 📦 Loaded data:", {
      myUsername: savedScoresData.myUsername,
      isHost: savedScoresData.isHost,
      scores: savedScoresData.scores
    });
  } catch (e) {
    console.error("[FinalScore] Failed to parse saved scores");
  }
}

if (!storedUsername || !storedRoomCode) {
  console.error("[FinalScore] ❌ Missing username or room code!");
  router.push("/");
}

const isHost = ref(storedIsHost);
const showCelebration = ref(true);
const celebrationAudio = ref<HTMLAudioElement | null>(null);

const JANUS_SERVER = import.meta.env.VITE_JANUS_SERVER;
const { players, sendMessage, leaveRoom, roomCode, username } = useJanusRoom(JANUS_SERVER);

if (!username.value) username.value = storedUsername;
if (!roomCode.value) roomCode.value = storedRoomCode;

interface PlayerScore {
  username: string;
  score: number;
}

const playerScores = ref<Record<string, number>>({});

// ✅ Load scores dari savedScoresData
if (savedScoresData && savedScoresData.scores) {
  playerScores.value = savedScoresData.scores;
}

const sortedPlayers = computed(() => {
  const scores: PlayerScore[] = [];

  // Combine players with their scores
  players.value.forEach((player) => {
    scores.push({
      username: player.username,
      score: playerScores.value[player.username] ?? 0,
    });
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores;
});

// ✅ Play celebration sound using Web Audio API
function playCelebrationSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create a simple celebratory tune
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const startTime = audioContext.currentTime;
  
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    const noteStart = startTime + (index * 0.2);
    const noteEnd = noteStart + 0.3;
    
    gainNode.gain.setValueAtTime(0.3, noteStart);
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);
    
    oscillator.start(noteStart);
    oscillator.stop(noteEnd);
  });
}

async function handlePlayAgain() {
  if (!isHost.value) {
    console.warn("[FinalScore] Only host can restart game");
    return;
  }

  // Clear all game data
  playerScores.value = {};
  localStorage.removeItem("finalScores");
  localStorage.removeItem("gameStarted");
  
  // Reset scores for all players
  players.value.forEach((player) => {
    playerScores.value[player.username] = 0;
  });

  // Broadcast restart
  sendMessage(
    JSON.stringify({
      type: "game_restart",
      timestamp: Date.now(),
    })
  );

  // Small delay to ensure message is sent
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  router.push("/lobby");
}

async function handleLeaveRoom() {
  await leaveRoom();
  localStorage.removeItem("roomCode");
  localStorage.removeItem("username");
  localStorage.removeItem("isHost");
  localStorage.removeItem("gameStarted");
  localStorage.removeItem("gameSettings");
  localStorage.removeItem("finalScores");
  router.push("/");
}

onMounted(() => {
  console.log("[FinalScore] 🏆 Final scores:", playerScores.value);
  console.log("[FinalScore] Players:", players.value);
  console.log("[FinalScore] Is Host:", isHost.value);
  
  // ✅ Play celebration animation and sound
  playCelebrationSound();
  
  // ✅ Hide celebration after 3 seconds
  setTimeout(() => {
    showCelebration.value = false;
  }, 3000);
});
</script>

<style scoped>
/* Existing styles */
.backdrop-filter {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}

.bgred {
  background-color: #FF0000;
}

/* 🎉 NEW ANIMATIONS */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-slow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-down {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes rise-up {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 1);
  }
}

@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes confetti-fall {
  to {
    transform: translateY(100vh) rotate(360deg);
  }
}

/* Apply animations */
.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-fade-in-slow {
  animation: fade-in-slow 1s ease-out;
}

.animate-bounce-in {
  animation: bounce-in 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-slide-in-up {
  animation: slide-in-up 0.8s ease-out forwards;
  opacity: 0;
}

.animate-slide-in-down {
  animation: slide-in-down 0.8s ease-out;
}

.animate-slide-in-left {
  animation: slide-in-left 0.6s ease-out forwards;
  opacity: 0;
}

.animate-slide-in-right {
  animation: slide-in-right 0.6s ease-out forwards;
  opacity: 0;
}

.animate-rise-up {
  animation: rise-up 0.8s ease-out forwards;
  opacity: 0;
}

.animate-pop-in {
  animation: pop-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  opacity: 0;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Confetti */
.confetti-container {
  position: fixed;
  top: -10px;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confetti-fall 3s linear infinite;
}
</style>