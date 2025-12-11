<template>
  <div
    class="min-h-screen p-0"
    style="
      background: linear-gradient(
        to bottom,
        #ef4444 10%,
        #ef4444 10%,
        #f3f4f6 40%,
        #f3f4f6 100%
      );
    "
  >
    <!-- Loading Overlay -->
    <div
      v-if="isLoadingQuestion"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-8 text-center border border-white border-opacity-20"
      >
        <div
          class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-white text-lg">
          {{ IS_HOST ? "Generating question..." : "Waiting for host..." }}
        </p>
      </div>
    </div>

    <!-- Pop Up Correct Answer -->
    <div
      v-if="showPointsPopup"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fade-in"
    >
      <!-- 🎉 Confetti untuk jawaban benar -->
      <div v-if="pointsEarned > 0" class="confetti-container">
        <div
          v-for="i in 50"
          :key="i"
          class="confetti"
          :style="{
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 0.5 + 's',
            background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][
              Math.floor(Math.random() * 5)
            ],
          }"
        ></div>
      </div>

      <!-- ❌ Rain effect untuk jawaban salah -->
      <div v-if="pointsEarned === 0" class="rain-container">
        <div
          v-for="i in 30"
          :key="i"
          class="raindrop"
          :style="{
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 0.3 + 's',
            animationDuration: 0.5 + Math.random() * 0.5 + 's',
          }"
        ></div>
      </div>

      <div
        class="bg-red-500 absolute left-3 right-3 top-80 bottom-80 rounded-3xl p-6 flex-col flex items-center justify-center shadow-lg"
        :class="
          pointsEarned > 0 ? 'animate-bounce-celebration' : 'animate-shake'
        "
      >
        <div
          class="bg-white rounded-3xl max-w-sm w-full h-full mx-4 border- border-red-500 shadow-2xl animate-scale-in"
        >
          <div class="bg-gray-50 rounded-2xl p-6 mb-4">
            <p class="text-black text-center text-xl mb-2">Current Score</p>
            <p
              class="text-5xl font-bold text-center mb-5 animate-score-pop"
              :class="pointsEarned > 0 ? 'text-green-500' : 'text-red-500'"
            >
              {{ pointsEarned > 0 ? "+" : "" }}{{ pointsEarned }} pts
            </p>
            <p class="text-gray-500 text-xm text-center">
              Correct: {{ correctAnswersCount }} / {{ currentQuestion }}
            </p>
          </div>

          <!-- ✅ Jawaban Benar dengan Emoji Animasi -->
          <div v-if="pointsEarned > 0" class="text-center">
            <p
              class="text-green-600 font-bold text-2xl mb-2 animate-text-bounce"
            >
              ✓ Correct!
            </p>
            <p class="text-gray-600 text-sm">Great job! Keep it up!</p>
          </div>

          <!-- ❌ Jawaban Salah dengan Emoji Animasi -->
          <div v-else class="text-center">
            <p class="text-red-600 font-bold text-2xl mb-2 animate-text-shake">
              ✗ Wrong Answer
            </p>
            <p class="text-gray-600 text-sm">Better luck next time!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Scoreboard Transition -->
    <div
      v-if="showScoreboard"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
      <div
        class="bg-red-500 backdrop-filter backdrop-blur-lg rounded-3xl p-6 max-w-2xl w-full mx-4 border border-white border-opacity-20 animate-slide-up"
      >
        <h2 class="text-3xl font-bold text-white text-center mb-6">
          Current Scores
        </h2>

        <div
          class="space-y-3 mb-8 relative max-w-sm"
          style="min-height: 80vh; min-width: 90vw"
        >
          <TransitionGroup name="list" tag="div" class="z-10">
            <div
              v-for="(player, index) in sortedPlayers"
              :key="player.username"
              class="bg-white text-black rounded-xl py-2 p-4 flex items-center justify-between transition-all duration-500 absolute w-full"
              :style="{ top: `${index * 72}px` }"
            >
              <div class="flex items-center">
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-full border border-gray-500 bg-white text-black font-bold text-md mr-4"
                >
                  {{ index + 1 }}
                </div>

                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center mr-3"
                  :style="{ backgroundColor: randomColor() }"
                >
                  <span class="text-black font-bold">
                    {{ player.username.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="text-black font-medium">{{ player.username }}</p>
                  <p class="text-gray-500 text-sm">{{ player.score }} points</p>
                </div>
              </div>

              <!-- ✅ MODIFIED: Tampilkan panah HANYA jika ada perubahan ranking -->
              <div
                v-if="player.lastChange && player.lastChange !== 0"
                class="flex items-center"
              >
                <span
                  v-if="player.lastChange > 0"
                  class="text-green-500 text-3xl font-bold animate-bounce-up"
                  >↑</span
                >
                <span
                  v-else-if="player.lastChange < 0"
                  class="text-red-500 text-3xl font-bold animate-bounce-down"
                  >↓</span
                >
              </div>
            </div>
          </TransitionGroup>
        </div>

        <p class="text-center text-white text-lg mb-4 mt-4">
          Next question in
          <span class="font-bold text-yellow-400">{{ countdownToNext }}</span>
          seconds...
        </p>
      </div>
    </div>

    <!-- Final Results -->
    <div
      v-if="showFinalResults"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6"
    >
      <div
        class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full border border-white border-opacity-20 animate-slide-up"
      >
        <h2 class="text-4xl font-bold text-white text-center mb-2">
          🎉 Game Over!
        </h2>
        <p class="text-gray-300 text-center mb-8">Final Scores</p>

        <div class="space-y-3 mb-8">
          <div
            v-for="(player, index) in sortedPlayers"
            :key="player.username"
            class="bg-white bg-opacity-10 rounded-xl p-5 flex items-center justify-between transition-all duration-300"
            :class="{
              'ring-4 ring-yellow-400 scale-105': index === 0,
              'ring-2 ring-gray-400': index === 1,
              'ring-2 ring-orange-400': index === 2,
            }"
          >
            <div class="flex items-center">
              <div
                class="text-3xl font-bold mr-4 w-10"
                :class="{
                  'text-yellow-400': index === 0,
                  'text-gray-300': index === 1,
                  'text-orange-400': index === 2,
                  'text-white': index > 2,
                }"
              >
                {{
                  index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : index + 1
                }}
              </div>
              <div
                class="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center mr-4"
              >
                <span class="text-white font-bold text-lg">{{
                  player.username.charAt(0).toUpperCase()
                }}</span>
              </div>
              <div>
                <p class="text-white font-bold text-lg">
                  {{ player.username }}
                </p>
                <p class="text-gray-300">{{ player.score }} / 150 points</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button
            @click="handlePlayAgain"
            v-if="IS_HOST"
            class="flex-1 py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105"
          >
            Play Again
          </button>
          <button
            @click="handleLeaveRoom"
            class="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>

    <!-- Main Game UI -->
    <div
      v-if="!showScoreboard && !showFinalResults"
      class="relative z-10 max-w-md mx-auto pt-6 px-4"
    >
      <!-- Question Card -->
      <div
        class="bg-indigo-900 rounded-3xl mt-10 p-6 relative shadow-2xl border-4 border-white"
        style="min-height: 300px; display: flex; flex-direction: column"
      >
        <!-- Score Display -->
        <div class="text-center mb-4">
          <p class="text-white text-sm font-medium mb-1">Your Score</p>
          <p class="text-white text-3xl font-bold">{{ myScore }}</p>
        </div>
        <!-- White Question Box -->
        <div
          class="bg-white absolute -bottom-10 left-3 right-3 rounded-3xl p-6 flex-col flex items-center justify-center shadow-lg"
        >
          <!-- Timer Badge -->
          <div
            class="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg z-10 border-8 border-red-500"
          >
            <p
              class="text-2xl font-bold text-black"
              :class="timeLeft <= 5 ? 'animate-pulse text-red-500' : ''"
            >
              {{ timeLeft }}
            </p>
          </div>
          <!-- Question Info -->
          <div class="text-center mt-8 mb-4">
            <p class="text-red-500 text-lg font-bold mb-1">
              Question {{ currentQuestion }} of 10
            </p>
            <p class="text-gray-400 text-xm">
              Soal dalam bahasa {{ quizData.region }}
            </p>
          </div>
          <h2
            class="text-gray-900 text-2xl font-bold text-center leading-relaxed"
          >
            {{ quizData.question || "Loading question..." }}
          </h2>
        </div>
      </div>

      <!-- Answer Options -->
      <div class="grid grid-cols-1 gap-8 mt-20">
        <button
          v-for="(option, index) in quizData.options"
          :key="index"
          @click="selectAnswer(index)"
          :disabled="timeLeft === 0"
          class="answer-btn p-5 rounded-2xl font-medium text-base transition-all duration-300 transform hover:scale-102 disabled:cursor-not-allowed shadow-md"
          :class="getButtonClass(index)"
        >
          <span class="flex items-center justify-between">
            <span class="text-left flex-grow">{{ option }}</span>
            <span
              v-if="timeLeft === 0 && index === quizData.correctAnswer"
              class="text-2xl ml-2"
              >✓</span
            >
            <span
              v-if="
                selectedAnswer === index &&
                index !== quizData.correctAnswer &&
                timeLeft === 0
              "
              class="text-2xl ml-2"
              >✗</span
            >
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useJanusRoom } from "@/composable/UseJanusRoom";
import {
  useDeepSeekQuiz as useGeminiQuiz,
  type QuizQuestion,
} from "@/utils/AIService";

const router = useRouter();

// ✅ CRITICAL FIX: Lock username dari sessionStorage DULU, baru localStorage
console.log("=".repeat(80));
console.log("[GamePage] 🎮 INITIALIZATION START");
console.log("=".repeat(80));

// ✅ STEP 1: Check sessionStorage first (tab-specific, NOT shared!)
const SESSION_USERNAME = sessionStorage.getItem("lockedUsername") || "";
const SESSION_ROOM_CODE = sessionStorage.getItem("lockedRoomCode") || "";
const SESSION_IS_HOST = sessionStorage.getItem("lockedIsHost") === "true";
const WINDOW_ID = sessionStorage.getItem("windowId") || "unknown";

console.log("[GamePage] 📦 sessionStorage (PRIORITY):", {
  username: SESSION_USERNAME,
  roomCode: SESSION_ROOM_CODE,
  isHost: SESSION_IS_HOST,
  windowId: WINDOW_ID,
});

// ✅ STEP 2: Check localStorage (might be corrupted, shared across tabs!)
const LOCAL_USERNAME = localStorage.getItem("username") || "";
const LOCAL_ROOM_CODE = localStorage.getItem("roomCode") || "";
const LOCAL_IS_HOST = localStorage.getItem("isHost") === "true";

console.log("[GamePage] 💾 localStorage (SECONDARY):", {
  username: LOCAL_USERNAME,
  roomCode: LOCAL_ROOM_CODE,
  isHost: LOCAL_IS_HOST,
});

// ✅ STEP 3: Determine FINAL values with PRIORITY
let LOCKED_USERNAME = "";
let LOCKED_ROOM_CODE = "";
let LOCKED_IS_HOST = false;

if (SESSION_USERNAME && SESSION_ROOM_CODE) {
  // ✅ Prioritas 1: sessionStorage
  LOCKED_USERNAME = SESSION_USERNAME;
  LOCKED_ROOM_CODE = SESSION_ROOM_CODE;
  LOCKED_IS_HOST = SESSION_IS_HOST;
  console.log("[GamePage] ✅ Using sessionStorage (RECOMMENDED)");
} else if (LOCAL_USERNAME && LOCAL_ROOM_CODE) {
  // ✅ Fallback: localStorage
  LOCKED_USERNAME = LOCAL_USERNAME;
  LOCKED_ROOM_CODE = LOCAL_ROOM_CODE;
  LOCKED_IS_HOST = LOCAL_IS_HOST;
  console.warn("[GamePage] ⚠️ Falling back to localStorage (RISKY!)");
} else {
  // ❌ FATAL: No valid data
  console.error("[GamePage] ❌ FATAL: No username/roomCode found!");
  console.error("  sessionStorage:", { SESSION_USERNAME, SESSION_ROOM_CODE });
  console.error("  localStorage:", { LOCAL_USERNAME, LOCAL_ROOM_CODE });
  alert("Session error! Returning to home...");
  router.push("/");
}

console.log("[GamePage] 🔒 FINAL LOCKED VALUES:", {
  username: LOCKED_USERNAME,
  roomCode: LOCKED_ROOM_CODE,
  isHost: LOCKED_IS_HOST,
  source: SESSION_USERNAME ? "sessionStorage" : "localStorage",
});

// ✅ STEP 4: CRITICAL - Lock isHost as IMMUTABLE constant
const IS_HOST = LOCKED_IS_HOST;

console.log("[GamePage] 🎭 FINAL ROLE:", IS_HOST ? "🔴 HOST" : "🔵 GUEST");
console.log("=".repeat(80));

// ✅ STEP 5: Verify consistency
if (SESSION_USERNAME && LOCAL_USERNAME && SESSION_USERNAME !== LOCAL_USERNAME) {
  console.error("[GamePage] ❌ MISMATCH DETECTED!");
  console.error("  sessionStorage username:", SESSION_USERNAME);
  console.error("  localStorage username:", LOCAL_USERNAME);
  console.warn("[GamePage] 🔧 Fixing localStorage to match sessionStorage...");
  
  localStorage.setItem("username", SESSION_USERNAME);
  localStorage.setItem("roomCode", SESSION_ROOM_CODE);
  localStorage.setItem("isHost", SESSION_IS_HOST ? "true" : "false");
  
  console.log("[GamePage] ✅ localStorage fixed!");
}

const playerRankings = ref<Record<string, number>>({});
const playerRankChanges = ref<Record<string, number>>({});

const geminiService = useGeminiQuiz();

const JANUS_SERVER = import.meta.env.VITE_JANUS_SERVER;
const { players, messages, roomCode, username, sendMessage, leaveRoom } =
  useJanusRoom(JANUS_SERVER);

// ✅ CRITICAL: Force correct username ke composable jika kosong
if (!username.value) {
  console.warn("[GamePage] ⚠️ Composable username empty, setting to:", LOCKED_USERNAME);
  username.value = LOCKED_USERNAME;
}
if (!roomCode.value) {
  console.warn("[GamePage] ⚠️ Composable roomCode empty, setting to:", LOCKED_ROOM_CODE);
  roomCode.value = LOCKED_ROOM_CODE;
}

// ✅ Verify consistency after setup
console.log("[GamePage] 🔍 VERIFICATION after setup:");
console.log("  LOCKED_USERNAME:", LOCKED_USERNAME);
console.log("  composable.username:", username.value);
console.log("  IS_HOST:", IS_HOST);
console.log("  Match:", username.value === LOCKED_USERNAME);

if (username.value !== LOCKED_USERNAME) {
  console.error("[GamePage] ❌ STILL MISMATCH after setup!");
  console.error("  Expected:", LOCKED_USERNAME);
  console.error("  Got:", username.value);
}

const savedSettings = JSON.parse(
  localStorage.getItem("gameSettings") || '{"mode":"bahasa","timeLimit":"5"}'
);
const gameCategory = ref(savedSettings.mode);
const totalGameTime =
  savedSettings.timeLimit === "unlimited"
    ? 600
    : parseInt(savedSettings.timeLimit) * 60;
const timePerQuestion = Math.floor(totalGameTime / 10);

const currentQuestion = ref(1);
const timeLeft = ref(timePerQuestion);
const selectedAnswer = ref<number | null>(null);
const isLoadingQuestion = ref(false);
const showScoreboard = ref(false);
const showFinalResults = ref(false);
const countdownToNext = ref(5);
const myScore = ref(0);
const quizReadyForTimer = ref(false);

const showPointsPopup = ref(false);
const pointsEarned = ref(0);
const correctAnswersCount = ref(0);
const lastScoreUpdate = ref<Record<string, number>>({});

const randomColor = () => {
  const colors = [
    "#FFB4B4",
    "#FFD37A",
    "#B4FF9F",
    "#9FD6FF",
    "#C9A7FF",
    "#FF9FE5",
    "#FFC48C",
    "#9FFFCB",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const quizData = ref<QuizQuestion>({
  question: "",
  options: [],
  correctAnswer: 0,
  category: "",
  region: "",
});

interface PlayerScore {
  username: string;
  score: number;
  lastChange?: number;
}

const playerScores = ref<Record<string, number>>({});
const previousRankings = ref<Record<string, number>>({});
const regionSequence = ref<string[]>([]);

const processedSeqNumbers = new Set<string>();
let isGenerating = false;

function createRegionSequence() {
  if (!IS_HOST) {
    console.warn("[createRegionSequence] ❌ BLOCKED! Not host");
    return;
  }

  const regions: string[] = [
    "Javanese (Jawa)",
    "Sundanese (Sunda)",
    "Balinese (Bali)",
    "Minangkabau (Minang)",
    "Batak",
  ];

  const sequence: string[] = [];
  regions.forEach((region) => {
    sequence.push(region, region);
  });

  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j]!, sequence[i]!];
  }

  regionSequence.value = sequence;
  console.log("[Host] Region sequence:", sequence);
}

const sortedPlayers = computed(() => {
  const scores: PlayerScore[] = [];

  players.value.forEach((player) => {
    const currentScore = playerScores.value[player.username] ?? 0;

    scores.push({
      username: player.username,
      score: currentScore,
      lastChange: 0,
    });
  });

  scores.sort((a, b) => b.score - a.score);

  scores.forEach((player, newRank) => {
    const oldRank = playerRankings.value[player.username];

    if (oldRank !== undefined && oldRank !== newRank) {
      const rankChange = oldRank - newRank;
      player.lastChange = rankChange;

      console.log(
        `[Ranking] ${player.username}: Rank ${oldRank} → ${newRank} (${
          rankChange > 0 ? "↑" : "↓"
        }${Math.abs(rankChange)})`
      );
    } else {
      player.lastChange = 0;
    }
  });

  return scores;
});

function captureCurrentRankings() {
  const currentRankings: Record<string, number> = {};

  if (players.value.length === 0) {
    console.warn("[Ranking] No players to rank");
    return;
  }

  const sortedByScore = [...players.value].sort((a, b) => {
    const scoreA = playerScores.value[a.username] ?? 0;
    const scoreB = playerScores.value[b.username] ?? 0;
    return scoreB - scoreA;
  });

  sortedByScore.forEach((player, index) => {
    currentRankings[player.username] = index;
  });

  console.log("[Ranking] 📸 Captured rankings:", {
    before: { ...playerRankings.value },
    after: currentRankings,
    scores: { ...playerScores.value },
  });

  playerRankings.value = currentRankings;
}

function clearRankChanges() {
  setTimeout(() => {
    playerRankChanges.value = {};
    console.log("[Ranking] Cleared rank changes");
  }, 2000);
}

function playCorrectSound() {
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  const notes = [523.25, 659.25, 783.99, 1046.5];
  const startTime = audioContext.currentTime;

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    const noteStart = startTime + index * 0.15;
    const noteEnd = noteStart + 0.2;

    gainNode.gain.setValueAtTime(0.3, noteStart);
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);

    oscillator.start(noteStart);
    oscillator.stop(noteEnd);
  });

  console.log("[Sound] 🎵 Playing correct answer sound");
}

function playWrongSound() {
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  const notes = [440, 349.23, 293.66];
  const startTime = audioContext.currentTime;

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sawtooth";

    const noteStart = startTime + index * 0.2;
    const noteEnd = noteStart + 0.3;

    gainNode.gain.setValueAtTime(0.2, noteStart);
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteEnd);

    oscillator.start(noteStart);
    oscillator.stop(noteEnd);
  });

  console.log("[Sound] 🔇 Playing wrong answer sound");
}

let timerInterval: any = null;

function broadcastMessage(type: string, data: any = {}) {
  if (!IS_HOST) {
    console.error(
      `[broadcastMessage] ❌ BLOCKED! Guest tried to broadcast ${type}`
    );
    return;
  }

  const uniqueSeq = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const message = {
    type,
    ...data,
    seq: uniqueSeq,
    hostId: LOCKED_USERNAME,
    timestamp: Date.now(),
  };

  console.log(`[Host] Broadcasting ${type} (seq: ${uniqueSeq})`);
  sendMessage(JSON.stringify(message));
}

function resetQuizState() {
  selectedAnswer.value = null;
  timeLeft.value = timePerQuestion;
  quizReadyForTimer.value = false;
  showPointsPopup.value = false;

  quizData.value = {
    question: "",
    options: [],
    correctAnswer: 0,
    category: "",
    region: "",
  };

  console.log(`[${IS_HOST ? "Host" : "Guest"}] ✨ Quiz state reset`);
}

async function generateAndBroadcastQuiz() {
  if (!IS_HOST) {
    console.error("[generateAndBroadcastQuiz] ❌ BLOCKED! Not host!");
    return;
  }

  if (isGenerating) {
    console.warn("[generateAndBroadcastQuiz] Already generating, aborting...");
    return;
  }

  isGenerating = true;

  resetQuizState();

  isLoadingQuestion.value = true;

  broadcastMessage("reset_quiz_state", {
    questionNumber: currentQuestion.value,
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  broadcastMessage("generating_question", {
    questionNumber: currentQuestion.value,
  });

  console.log(`[Host] 🎯 Generating question ${currentQuestion.value}/10`);

  try {
    const questionIndex = currentQuestion.value - 1;
    const region = regionSequence.value[questionIndex];

    if (currentQuestion.value > 1) {
      console.log("[Host] ⏳ Waiting 2s to prevent rate limit...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const quiz = await geminiService.generateQuiz(gameCategory.value, region);
    console.log(`[Host] ✅ Generated quiz:`, {
      region,
      question: quiz.question,
      correctAnswer: quiz.correctAnswer,
    });

    quizData.value = quiz;
    isLoadingQuestion.value = false;
    quizReadyForTimer.value = true;

    await new Promise((resolve) => setTimeout(resolve, 100));

    broadcastMessage("new_question", {
      questionNumber: currentQuestion.value,
      quizData: quiz,
    });

    console.log(`[Host] 📤 Question ${currentQuestion.value} broadcasted`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("[Host] 🚀 Broadcasting start_timer");
    broadcastMessage("start_timer");
    startTimer();
  } catch (error) {
    console.error("[Host] ❌ Failed to generate quiz:", error);
    isLoadingQuestion.value = false;
    isGenerating = false;
  } finally {
    isGenerating = false;
  }
}

function receiveQuizFromHost(data: any) {
  if (IS_HOST) {
    console.log("[Guest] ❌ BLOCKED! Host should not receive quiz");
    return;
  }

  console.log(`[Guest] 📥 Received question ${data.questionNumber}`);

  currentQuestion.value = data.questionNumber;
  quizData.value = data.quizData;
  isLoadingQuestion.value = false;
  selectedAnswer.value = null;
  quizReadyForTimer.value = true;

  console.log(`[Guest] ✅ Quiz ready, waiting for timer signal`);
}

function startTimer() {
  const role = IS_HOST ? "Host" : "Guest";
  console.log(`[${role}] ⏱️ Starting timer for Q${currentQuestion.value}`);

  if (timerInterval) {
    console.warn(`[${role}] ⚠️ Clearing existing timer`);
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (
    !quizData.value.question ||
    !quizData.value.options ||
    quizData.value.options.length !== 4
  ) {
    console.error(`[${role}] ❌ Invalid quiz data:`, quizData.value);
    return;
  }

  timeLeft.value = timePerQuestion;
  console.log(`[${role}] ⏰ Timer: ${timePerQuestion}s`);

  timerInterval = setInterval(() => {
    timeLeft.value--;

    if (timeLeft.value <= 0) {
      console.log(`[${role}] ⏰ Time's up!`);
      clearInterval(timerInterval);
      timerInterval = null;
      quizReadyForTimer.value = false;
      handleTimeUp();
    }
  }, 1000);
}

function handleTimeUp() {
  console.log(`[${IS_HOST ? "Host" : "Guest"}] ⏰ Time's up!`);

  if (selectedAnswer.value === null) {
    selectedAnswer.value = -1;
    pointsEarned.value = 0;
  }

  const isCorrect = selectedAnswer.value === quizData.value.correctAnswer;

  captureCurrentRankings();

  if (isCorrect && pointsEarned.value > 0) {
    myScore.value += pointsEarned.value;
    correctAnswersCount.value++;
    console.log(
      `[Score] 💯 Earned ${pointsEarned.value} pts | Total: ${myScore.value}`
    );
  }

  // ✅ CRITICAL: Use LOCKED_USERNAME consistently
  playerScores.value = {
    ...playerScores.value,
    [LOCKED_USERNAME]: myScore.value,
  };
  console.log(
    `[Score] 📝 Updated own score: ${LOCKED_USERNAME} = ${myScore.value}`
  );

  const myAnswerResult = {
    type: "answer_result",
    username: LOCKED_USERNAME,
    correct: isCorrect,
    score: myScore.value,
    pointsEarned: pointsEarned.value,
    timestamp: Date.now(),
  };

  sendMessage(JSON.stringify(myAnswerResult));
  
  console.log(
    `[Score] 📤 Broadcast answer_result: ${LOCKED_USERNAME} = ${myScore.value}`
  );

  setTimeout(() => {
    showPointsPopup.value = true;
    console.log(`[Popup] 🎉 Showing points popup: ${pointsEarned.value} pts`);
    console.log(`[Score] 📊 Final playerScores:`, { ...playerScores.value });

    if (pointsEarned.value > 0) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    setTimeout(() => {
      showPointsPopup.value = false;

      if (currentQuestion.value >= 10) {
        const finalScoresData = {
          isHost: IS_HOST,
          myUsername: LOCKED_USERNAME,
          scores: { ...playerScores.value },
        };

        localStorage.setItem("finalScores", JSON.stringify(finalScoresData));
        console.log("[Game] 💾 Saving final scores:", finalScoresData);

        if (IS_HOST) {
          broadcastMessage("game_over", {
            finalScores: playerScores.value,
          });
        }

        setTimeout(() => {
          router.push("/finalscore");
        }, 500);
      } else {
        if (IS_HOST) {
          console.log("[Host] 📊 Broadcasting show_scoreboard");
          broadcastMessage("show_scoreboard");
          showScoreboard.value = true;
          startScoreboardCountdown();
        }
      }
    }, 2500);
  }, 1500);
}

function startScoreboardCountdown() {
  if (!IS_HOST) {
    console.warn("[Guest] ❌ Blocked startScoreboardCountdown");
    return;
  }

  console.log("[Host] ⏱️ Starting scoreboard countdown from 5");
  countdownToNext.value = 5;

  const interval = setInterval(() => {
    countdownToNext.value--;
    console.log(`[Host] Countdown: ${countdownToNext.value}`);

    if (countdownToNext.value <= 0) {
      clearInterval(interval);
      showScoreboard.value = false;
      console.log("[Host] Scoreboard closed");

      if (currentQuestion.value >= 10) {
        console.log("[Host] 🏁 Game finished, broadcasting game_over");
        broadcastMessage("game_over", { finalScores: playerScores.value });

        setTimeout(() => {
          router.push("/finalscore");
        }, 500);
      } else {
        setTimeout(() => {
          Object.keys(playerRankChanges.value).forEach((username) => {
            playerRankChanges.value[username] = 0;
          });
          console.log("[Host] Cleared rank changes");
        }, 500);

        currentQuestion.value++;
        resetQuizState();

        console.log(`[Host] 🔄 Moving to question ${currentQuestion.value}`);
        setTimeout(() => {
          generateAndBroadcastQuiz();
        }, 200);
      }
    }
  }, 1000);
}

function selectAnswer(index: number) {
  if (timeLeft.value === 0) return;

  selectedAnswer.value = index;

  const isCorrect = index === quizData.value.correctAnswer;

  if (isCorrect) {
    const maxPoints = 15;
    const minPoints = 3;
    const pointRange = maxPoints - minPoints;

    const timeRatio = timeLeft.value / timePerQuestion;
    const calculatedPoints = Math.round(minPoints + pointRange * timeRatio);
    pointsEarned.value = Math.max(
      minPoints,
      Math.min(maxPoints, calculatedPoints)
    );

    console.log(
      `[Answer] ✅ Correct! Time left: ${timeLeft.value}s → ${pointsEarned.value} pts`
    );
  } else {
    pointsEarned.value = 0;
    console.log(`[Answer] ❌ Wrong answer`);
  }

  sendMessage(
    JSON.stringify({
      type: "player_answer",
      username: LOCKED_USERNAME,
      answer: index,
      correct: isCorrect,
      pointsEarned: pointsEarned.value,
      timeLeft: timeLeft.value,
      timestamp: Date.now(),
    })
  );
}

function getButtonClass(index: number) {
  if (!quizData.value.question || quizData.value.options.length === 0) {
    return "bg-white text-gray-400 cursor-not-allowed border-2 border-gray-200";
  }

  if (timeLeft.value === 0 && quizReadyForTimer.value === false) {
    if (index === quizData.value.correctAnswer) {
      return "bg-green-500 text-white ";
    }
    if (
      selectedAnswer.value === index &&
      index !== quizData.value.correctAnswer
    ) {
      return "bg-red-500 text-white ";
    }
    return "bg-white text-gray-500 border-answer";
  }

  if (selectedAnswer.value === index) {
    return "bg-indigo-900 text-white scale-105";
  }

  return " border-answer bg-white text-gray-800 hover:bg-gray-50 hover:border-indigo-300";
}

async function handlePlayAgain() {
  currentQuestion.value = 1;
  myScore.value = 0;
  correctAnswersCount.value = 0;
  showFinalResults.value = false;

  playerScores.value = {};
  previousRankings.value = {};
  lastScoreUpdate.value = {};
  quizReadyForTimer.value = false;

  if (IS_HOST) {
    console.log("[Host] 🔄 Restarting game");
    geminiService.resetUsedSentences();
    createRegionSequence();
    processedSeqNumbers.clear();
  }

  sendMessage(JSON.stringify({ type: "game_restart", timestamp: Date.now() }));
  router.push("/lobby");
}

async function handleLeaveRoom() {
  await leaveRoom();
  localStorage.removeItem("roomCode");
  localStorage.removeItem("username");
  localStorage.removeItem("isHost");
  localStorage.removeItem("gameStarted");
  localStorage.removeItem("gameSettings");
  sessionStorage.clear();
  router.push("/");
}

watch(
  players,
  (newPlayers) => {
    newPlayers.forEach((player) => {
      if (playerScores.value[player.username] === undefined) {
        playerScores.value = {
          ...playerScores.value,
          [player.username]: 0,
        };
        previousRankings.value = {
          ...previousRankings.value,
          [player.username]: 999,
        };
      }
    });
  },
  { deep: true, immediate: true }
);

let lastProcessedIndex = 0;

watch(
  messages,
  (newMessages) => {
    const newCount = newMessages.length;

    for (let i = lastProcessedIndex; i < newCount; i++) {
      const msg = newMessages[i];
      if (!msg || msg.type !== "chat") continue;

      try {
        const data = JSON.parse(msg.message);

        if (data.seq && processedSeqNumbers.has(data.seq)) {
          console.log(`[Dedupe] 🚫 Skip duplicate: ${data.seq}`);
          continue;
        }

        if (data.seq) {
          processedSeqNumbers.add(data.seq);
        }

        console.log(
          `[Message] 📨 Type: ${data.type}, From: ${msg.sender}, MyRole: ${
            IS_HOST ? "Host" : "Guest"
          }`
        );

        if (!IS_HOST) {
          if (data.type === "reset_quiz_state") {
            console.log("[Guest] 🔄 Resetting quiz state...");
            resetQuizState();
            currentQuestion.value = data.questionNumber;
          } else if (data.type === "generating_question") {
            console.log("[Guest] 🔄 Host is generating question...");
            isLoadingQuestion.value = true;
          } else if (data.type === "new_question") {
            console.log("[Guest] 📥 Processing new_question");
            receiveQuizFromHost(data);
          } else if (data.type === "start_timer") {
            console.log("[Guest] ⏱️ Timer signal received");

            const attemptStartTimer = (attempts = 0) => {
              if (quizReadyForTimer.value && quizData.value.question) {
                console.log("[Guest] ✅ Starting timer NOW");
                startTimer();
                quizReadyForTimer.value = false;
              } else if (attempts < 10) {
                console.warn(
                  `[Guest] ⏳ Quiz not ready, retry ${attempts + 1}/10`
                );
                setTimeout(() => attemptStartTimer(attempts + 1), 200);
              } else {
                console.error("[Guest] ❌ Quiz never loaded!");
              }
            };

            attemptStartTimer();
          } else if (data.type === "show_scoreboard") {
            console.log("[Guest] 📊 Show scoreboard");
            showScoreboard.value = true;

            countdownToNext.value = 5;
            const guestCountdown = setInterval(() => {
              countdownToNext.value--;
              if (countdownToNext.value <= 0) {
                clearInterval(guestCountdown);
                showScoreboard.value = false;

                Object.keys(playerRankChanges.value).forEach((username) => {
                  playerRankChanges.value[username] = 0;
                });
                console.log(
                  "[Guest] Cleared rank changes, waiting for next question"
                );
              }
            }, 1000);
          } else if (data.type === "game_over") {
            console.log("[Guest] 🏁 Game over, redirecting...");
            setTimeout(() => {
              router.push("/finalscore");
            }, 500);
          } else if (data.type === "game_restart") {
            console.log("[Guest] 🔄 Restart");
            router.push("/lobby");
          }
        }

        // ✅ CRITICAL FIX: Skip answer_result dari diri sendiri
        if (data.type === "answer_result" && data.username) {
          if (data.username === LOCKED_USERNAME) {
            console.log(
              `[Score] ⏭️ Skipping own answer_result: ${data.username} = ${data.score} pts`
            );
            continue;
          }

          console.log(
            `[Score] 💯 Received answer_result from OTHER player: ${data.username} = ${data.score} pts`
          );

          const currentTimestamp = lastScoreUpdate.value[data.username] || 0;
          const newTimestamp = data.timestamp || Date.now();

          if (newTimestamp >= currentTimestamp) {
            const currentScore = playerScores.value[data.username] || 0;
            if (data.score >= currentScore) {
              playerScores.value = {
                ...playerScores.value,
                [data.username]: data.score,
              };
              lastScoreUpdate.value = {
                ...lastScoreUpdate.value,
                [data.username]: newTimestamp,
              };
              console.log(
                `[Score] ✅ Updated ${data.username}: ${currentScore} → ${data.score}`
              );
            } else {
              console.warn(
                `[Score] ⚠️ Rejected decrease for ${data.username}: ${data.score} < ${currentScore}`
              );
            }
          } else {
            console.warn(
              `[Score] ⚠️ Rejected old message for ${data.username}`
            );
          }
        }
      } catch (e) {
        console.error("[Watch] ❌ Parse error:", e);
      }
    }

    lastProcessedIndex = newCount;
  },
  { deep: true }
);

onMounted(async () => {
  console.log("=".repeat(60));
  console.log("[GamePage] 🎮 COMPONENT MOUNTED");
  console.log("=".repeat(60));
  
  // ✅ FINAL CHECK: Verify all values before starting
  console.log("[GamePage] 🔍 FINAL VERIFICATION:");
  console.log("  LOCKED_USERNAME:", LOCKED_USERNAME);
  console.log("  LOCKED_ROOM_CODE:", LOCKED_ROOM_CODE);
  console.log("  IS_HOST:", IS_HOST);
  console.log("  composable.username:", username.value);
  console.log("  composable.roomCode:", roomCode.value);
  console.log("  sessionStorage.lockedUsername:", sessionStorage.getItem('lockedUsername'));
  console.log("  localStorage.username:", localStorage.getItem('username'));
  console.log("=".repeat(60));

  if (!IS_HOST && !LOCKED_IS_HOST) {
    console.log("[GamePage] ✅ Confirmed as GUEST");
  } else if (IS_HOST && LOCKED_IS_HOST) {
    console.log("[GamePage] ✅ Confirmed as HOST");
  } else {
    console.error("[GamePage] ❌❌❌ MISMATCH DETECTED!");
    alert("Session error detected. Returning to lobby...");
    router.push("/lobby");
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const initialScores: Record<string, number> = {};
  const initialRankings: Record<string, number> = {};

  players.value.forEach((player, index) => {
    initialScores[player.username] = 0;
    initialRankings[player.username] = index;
  });

  playerScores.value = initialScores;
  playerRankings.value = initialRankings;

  console.log("[GamePage] 📊 Initial playerScores:", { ...playerScores.value });

  if (IS_HOST) {
    console.log("[GamePage] 🎮 Initializing as GAME MASTER");
    geminiService.resetUsedSentences();
    createRegionSequence();
    await generateAndBroadcastQuiz();
  } else {
    isLoadingQuestion.value = true;
    console.log("[GamePage] ⏳ Waiting for host to broadcast question...");
    console.log("[GamePage] ⚠️ I should NOT generate quiz myself!");
  }
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  console.log("[GamePage] Component unmounted");
});
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
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

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.backdrop-filter {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.hover\:scale-102:hover {
  transform: scale(1.02);
}

.list-move {
  transition: all 0.8s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-active {
  transition: all 0.6s ease-out;
}

.list-leave-active {
  transition: all 0.6s ease-in;
  position: absolute;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

@keyframes bounce-up {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  25% {
    transform: translateY(-15px) scale(1.3);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-5px) scale(1.1);
    opacity: 1;
  }
  75% {
    transform: translateY(-10px) scale(1.2);
    opacity: 0.9;
  }
}

@keyframes bounce-down {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  25% {
    transform: translateY(15px) scale(1.3);
    opacity: 0.8;
  }
  50% {
    transform: translateY(5px) scale(1.1);
    opacity: 1;
  }
  75% {
    transform: translateY(10px) scale(1.2);
    opacity: 0.9;
  }
}

.animate-bounce-up {
  animation: bounce-up 1.5s ease-in-out infinite;
}

.animate-bounce-down {
  animation: bounce-down 1.5s ease-in-out infinite;
}

.bg-white {
  transition: all 0.3s ease;
}

.bg-white:has(.animate-bounce-up) {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
  transform: scale(1.02);
}

.bg-white:has(.animate-bounce-down) {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}

.border-answer {
  border: 1px solid black;
}

@keyframes bounce-celebration {
  0%,
  100% {
    transform: scale(1);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: scale(1.05) rotate(-2deg);
  }
  20%,
  40%,
  60%,
  80% {
    transform: scale(1.05) rotate(2deg);
  }
}

@keyframes celebrate-emoji {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.3) rotate(-15deg);
  }
  50% {
    transform: scale(1.2) rotate(15deg);
  }
  75% {
    transform: scale(1.3) rotate(-10deg);
  }
}

@keyframes text-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes score-pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-10px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(10px);
  }
}

@keyframes sad-emoji {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.9);
  }
}

@keyframes text-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25%,
  75% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px);
  }
}

.confetti-container {
  position: fixed;
  top: -10px;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 60;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confetti-fall 2s linear forwards;
}

@keyframes confetti-fall {
  to {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.rain-container {
  position: fixed;
  top: -10px;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 60;
}

.raindrop {
  position: absolute;
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, transparent, #3b82f6);
  animation: rain-fall linear forwards;
}

@keyframes rain-fall {
  to {
    transform: translateY(100vh);
    opacity: 0;
  }
}

.animate-bounce-celebration {
  animation: bounce-celebration 1s ease-in-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-celebrate-emoji {
  animation: celebrate-emoji 1s ease-in-out infinite;
}

.animate-sad-emoji {
  animation: sad-emoji 2s ease-in-out infinite;
}

.animate-text-bounce {
  animation: text-bounce 0.6s ease-in-out infinite;
}

.animate-text-shake {
  animation: text-shake 0.3s ease-in-out 3;
}

.animate-score-pop {
  animation: score-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
</style>