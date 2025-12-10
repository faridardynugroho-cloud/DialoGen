<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6"
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

    <!-- Scoreboard Transition -->
    <div
      v-if="showScoreboard"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
      <div
        class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full mx-4 border border-white border-opacity-20 animate-slide-up"
      >
        <h2 class="text-3xl font-bold text-white text-center mb-6">
          🏆 Current Scores
        </h2>

        <div class="space-y-3 mb-8 relative" style="min-height: 400px">
          <TransitionGroup name="list" tag="div">
            <div
              v-for="(player, index) in sortedPlayers"
              :key="player.username"
              class="bg-white bg-opacity-10 rounded-xl p-4 flex items-center justify-between transition-all duration-500 absolute w-full"
              :style="{ top: `${index * 72}px` }"
              :class="{
                'ring-2 ring-yellow-400 scale-105': index === 0,
                'ring-1 ring-gray-400': index === 1,
                'ring-1 ring-orange-400': index === 2,
              }"
            >
              <div class="flex items-center">
                <div
                  class="text-2xl font-bold mr-4 w-8"
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
                  class="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center mr-3"
                >
                  <span class="text-white font-bold">{{
                    player.username.charAt(0).toUpperCase()
                  }}</span>
                </div>
                <div>
                  <p class="text-white font-medium">{{ player.username }}</p>
                  <p class="text-gray-300 text-sm">{{ player.score }} points</p>
                </div>
              </div>
              <div v-if="player.lastChange" class="flex items-center">
                <span
                  v-if="player.lastChange > 0"
                  class="text-green-400 text-2xl animate-bounce"
                  >↑</span
                >
                <span
                  v-else-if="player.lastChange < 0"
                  class="text-red-400 text-2xl animate-bounce"
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
                <p class="text-gray-300">{{ player.score }} / 100 points</p>
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
      class="relative z-10 max-w-4xl mx-auto"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div
          class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20"
        >
          <p class="text-gray-300 text-sm">Question</p>
          <p class="text-2xl font-bold text-white">
            {{ currentQuestion }} / 10
          </p>
        </div>

        <div
          class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20"
        >
          <p class="text-gray-300 text-sm">Time</p>
          <p
            class="text-2xl font-bold"
            :class="timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'"
          >
            {{ timeLeft }}s
          </p>
        </div>

        <div
          class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20"
        >
          <p class="text-gray-300 text-sm">Your Score</p>
          <p class="text-2xl font-bold text-yellow-400">{{ myScore }}</p>
        </div>
      </div>

      <!-- Question Card -->
      <div
        class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white border-opacity-20"
      >
        <div class="mb-6">
          <p class="text-gray-300 text-sm mb-2">Terjemahkan kalimat berikut:</p>
          <h2 class="text-4xl font-bold text-white mb-4">
            {{ quizData.question }}
          </h2>

          <p class="text-gray-300 text-sm">
            Pilih arti yang benar dalam Bahasa Indonesia
          </p>
        </div>
      </div>

      <!-- Answer Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          v-for="(option, index) in quizData.options"
          :key="index"
          @click="selectAnswer(index)"
          :disabled="timeLeft === 0"
          class="p-6 rounded-2xl font-medium text-lg transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed"
          :class="getButtonClass(index)"
        >
          <span class="flex items-center justify-between">
            <span>{{ option }}</span>
            <span
              v-if="timeLeft === 0 && index === quizData.correctAnswer"
              class="text-2xl"
              >✓</span
            >
            <span
              v-if="
                selectedAnswer === index &&
                index !== quizData.correctAnswer &&
                timeLeft === 0
              "
              class="text-2xl"
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

const storedUsername = localStorage.getItem("username") || "";
const storedRoomCode = localStorage.getItem("roomCode") || "";

// ✅ FIX: Cek isHost dengan benar
const localIsHost = localStorage.getItem("isHost");
const storedIsHost = localIsHost === "true";

if (!storedUsername || !storedRoomCode) {
  console.error("[Game] ❌ Missing username or room code!");
  router.push("/");
}

// ✅ CRITICAL: Immutable IS_HOST
const IS_HOST = storedIsHost;

// ✅ Log untuk debugging
console.log("[Game] 🔍 INIT CHECK:", {
  username: storedUsername,
  isHostFromStorage: localIsHost,
  finalIsHost: IS_HOST,
  roomCode: storedRoomCode,
});

const geminiService = useGeminiQuiz();

const JANUS_SERVER = import.meta.env.VITE_JANUS_SERVER;
const { players, messages, roomCode, username, sendMessage, leaveRoom } =
  useJanusRoom(JANUS_SERVER);

if (!username.value) username.value = storedUsername;
if (!roomCode.value) roomCode.value = storedRoomCode;

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
    const prevRank = previousRankings.value[player.username] ?? 999;

    scores.push({
      username: player.username,
      score: currentScore,
      lastChange: 0,
    });
  });

  scores.sort((a, b) => b.score - a.score);

  scores.forEach((player, newRank) => {
    const prevRank = previousRankings.value[player.username] ?? 999;
    player.lastChange = prevRank - newRank;
  });

  return scores;
});

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
    hostId: storedUsername,
    timestamp: Date.now(),
  };

  console.log(`[Host] Broadcasting ${type} (seq: ${uniqueSeq})`);
  sendMessage(JSON.stringify(message));
}

function resetQuizState() {
  selectedAnswer.value = null;
  // ✅ Set ke nilai default timePerQuestion, BUKAN 0
  timeLeft.value = timePerQuestion;
  quizReadyForTimer.value = false;
  
  // Reset quiz data ke state kosong
  quizData.value = {
    question: "",
    options: [],
    correctAnswer: 0,
    category: "",
    region: ""
  };
  
  console.log(`[${IS_HOST ? 'Host' : 'Guest'}] ✨ Quiz state reset`);
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

  // ✅ RESET STATE DULU sebelum generate
  resetQuizState();

  isLoadingQuestion.value = true;

  // ✅ Broadcast reset ke semua guest SEBELUM generate
  broadcastMessage("reset_quiz_state", {
    questionNumber: currentQuestion.value,
  });

  // ✅ Kasih waktu guest untuk reset
  await new Promise((resolve) => setTimeout(resolve, 100));

  // ✅ Baru broadcast generating
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

    // ✅ Set quiz data untuk host
    quizData.value = quiz;
    isLoadingQuestion.value = false;
    quizReadyForTimer.value = true;

    // ✅ Kurangi delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // ✅ Broadcast ke semua guest
    broadcastMessage("new_question", {
      questionNumber: currentQuestion.value,
      quizData: quiz,
    });

    console.log(`[Host] 📤 Question ${currentQuestion.value} broadcasted`);

    // ✅ Kurangi wait time jadi 500ms saja
    await new Promise((resolve) => setTimeout(resolve, 500));

    // ✅ Baru broadcast start_timer
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
  const role = IS_HOST ? 'Host' : 'Guest';
  console.log(`[${role}] ⏱️ Starting timer for Q${currentQuestion.value}`);
  
  if (timerInterval) {
    console.warn(`[${role}] ⚠️ Clearing existing timer`);
    clearInterval(timerInterval);
  }
  
  if (!quizData.value.question || !quizData.value.options || quizData.value.options.length !== 4) {
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
      // ✅ Set flag bahwa quiz sudah selesai
      quizReadyForTimer.value = false;
      handleTimeUp();
    }
  }, 1000);
}

function handleTimeUp() {
  console.log(`[${IS_HOST ? "Host" : "Guest"}] ⏰ Time's up!`);

  if (selectedAnswer.value === null) {
    selectedAnswer.value = -1;
  }

  if (selectedAnswer.value === quizData.value.correctAnswer) {
    myScore.value += 10;
    playerScores.value = {
      ...playerScores.value,
      [storedUsername]: myScore.value,
    };
    console.log(`[Score] 💯 My score: ${myScore.value}`);
  }

  sendMessage(
    JSON.stringify({
      type: "answer_result",
      username: storedUsername,
      correct: selectedAnswer.value === quizData.value.correctAnswer,
      score: myScore.value,
      timestamp: Date.now(),
    })
  );

  if (IS_HOST) {
    setTimeout(() => {
      console.log("[Host] 📊 Broadcasting show_scoreboard");
      broadcastMessage("show_scoreboard");
      showScoreboard.value = true;
      startScoreboardCountdown();
    }, 2000);
  }
}

function startScoreboardCountdown() {
  countdownToNext.value = 5;
  const interval = setInterval(() => {
    countdownToNext.value--;
    if (countdownToNext.value <= 0) {
      clearInterval(interval);
      showScoreboard.value = false;

      if (currentQuestion.value >= 10) {
        if (IS_HOST) {
          console.log("[Host] 🏁 Broadcasting game_over");
          broadcastMessage("game_over");
        }
        showFinalResults.value = true;
      } else {
        // ✅ Increment question number
        currentQuestion.value++;

        // ✅ RESET STATE sebelum generate soal baru (untuk HOST & GUEST)
        resetQuizState();

        if (IS_HOST) {
          console.log(`[Host] 🔄 Moving to question ${currentQuestion.value}`);
          // ✅ Kurangi delay sebelum generate
          setTimeout(() => {
            generateAndBroadcastQuiz();
          }, 200);
        }
      }
    }
  }, 1000);
}

function selectAnswer(index: number) {
  if (timeLeft.value === 0) return;
  selectedAnswer.value = index;

  sendMessage(
    JSON.stringify({
      type: "player_answer",
      username: storedUsername,
      answer: index,
      correct: index === quizData.value.correctAnswer,
      timestamp: Date.now(),
    })
  );
}

function getButtonClass(index: number) {
  // ✅ Check jika belum ada quiz data
  if (!quizData.value.question || quizData.value.options.length === 0) {
    return "bg-white bg-opacity-10 text-gray-400 border border-white border-opacity-20 cursor-not-allowed";
  }
  
  // ✅ PENTING: Hanya tampilkan jawaban benar jika timer BENAR-BENAR habis DAN quiz sudah ready
  if (timeLeft.value === 0 && quizReadyForTimer.value === false) {
    // Timer habis SETELAH quiz selesai dijawab
    if (index === quizData.value.correctAnswer) {
      return "bg-green-500 text-white ring-4 ring-green-300";
    }
    if (selectedAnswer.value === index && index !== quizData.value.correctAnswer) {
      return "bg-red-500 text-white ring-4 ring-red-300";
    }
    return "bg-white bg-opacity-10 text-gray-400 border border-white border-opacity-20";
  }

  // Jika masih ada waktu atau sedang loading
  if (selectedAnswer.value === index) {
    return "bg-blue-500 text-white ring-4 ring-blue-300";
  }

  return "bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-opacity-30";
}

async function handlePlayAgain() {
  currentQuestion.value = 1;
  myScore.value = 0;
  showFinalResults.value = false;

  playerScores.value = {};
  previousRankings.value = {};
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

        // ✅ CRITICAL: Hanya guest yang proses broadcast dari host
        if (!IS_HOST) {
          // ✅ TAMBAHKAN: Handler reset state (PRIORITAS PERTAMA)
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
            startScoreboardCountdown();
          } else if (data.type === "game_over") {
            console.log("[Guest] 🏁 Game over");
            showFinalResults.value = true;
          } else if (data.type === "game_restart") {
            console.log("[Guest] 🔄 Restart");
            router.push("/lobby");
          }
        }

        // ✅ Semua player (host & guest) update score
        if (data.type === "answer_result" && data.username) {
          console.log(`[Score] 💯 ${data.username}: ${data.score} pts`);
          playerScores.value = {
            ...playerScores.value,
            [data.username]: data.score,
          };
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
  console.log(`[Game] ⚡ MOUNTED`);
  console.log(`[Game] 👤 Username: ${storedUsername}`);
  console.log(`[Game] 🏠 Room: ${storedRoomCode}`);
  console.log(`[Game] 🔍 localStorage.isHost: "${localIsHost}"`);
  console.log(`[Game] 🎯 Computed IS_HOST: ${IS_HOST}`);
  console.log("=".repeat(60));

  // ✅ CRITICAL SAFETY CHECK
  if (!IS_HOST && !storedIsHost) {
    console.log("[Game] ✅ Confirmed as GUEST");
  } else if (IS_HOST && storedIsHost) {
    console.log("[Game] ✅ Confirmed as HOST");
  } else {
    console.error("[Game] ❌❌❌ MISMATCH DETECTED!");
    console.error("[Game] IS_HOST:", IS_HOST);
    console.error("[Game] storedIsHost:", storedIsHost);
    console.error("[Game] localStorage.isHost:", localIsHost);

    // ✅ Force correct value
    const correctIsHost = localStorage.getItem("isHost") === "true";
    console.log("[Game] 🔧 Forcing IS_HOST to:", correctIsHost);

    // Redirect back to lobby if mismatch
    alert("Session error detected. Returning to lobby...");
    router.push("/lobby");
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const initialScores: Record<string, number> = {};
  const initialRankings: Record<string, number> = {};

  players.value.forEach((player) => {
    initialScores[player.username] = 0;
    initialRankings[player.username] = 999;
  });

  playerScores.value = initialScores;
  previousRankings.value = initialRankings;

  if (IS_HOST) {
    console.log("[Host] 🎮 Initializing as GAME MASTER");
    geminiService.resetUsedSentences();
    createRegionSequence();

    await generateAndBroadcastQuiz();
  } else {
    isLoadingQuestion.value = true;
    console.log("[Guest] ⏳ Waiting for host to broadcast question...");
    console.log("[Guest] ⚠️ I should NOT generate quiz myself!");
  }
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  console.log(`[Game] 👋 Unmounted (${IS_HOST ? "Host" : "Guest"})`);
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
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
}

.backdrop-filter {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>
