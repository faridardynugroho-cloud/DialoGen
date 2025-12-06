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
        <p class="text-white text-lg">Generating question...</p>
      </div>
    </div>

    <!-- Scoreboard Transition dengan Animasi -->
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
          <!-- ✅ ANIMATED SCOREBOARD -->
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
              <!-- ✅ ARROW INDICATOR -->
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
            v-if="isHost"
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
          <p class="text-gray-300 text-sm mb-2">Soal dalam Bahasa Daerah:</p>
          <h2 class="text-3xl font-bold text-white mb-4">
            {{ quizData.question }}
          </h2>

          <p class="text-gray-300 text-sm mb-2">
            Tebak arti kata yang dicetak tebal:
          </p>
          <p class="text-2xl font-bold text-yellow-400">
            {{ quizData.targetWord }}
          </p>
        </div>

        <!-- Translation (shown after time's up) -->
        <div
          v-if="timeLeft === 0"
          class="mt-6 pt-6 border-t border-white border-opacity-20 animate-fade-in"
        >
          <p class="text-gray-300 text-sm mb-2">Arti lengkap:</p>
          <p class="text-xl text-white">{{ quizData.fullTranslation }}</p>
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

      <!-- ✅ HAPUS LIVE SCOREBOARD - Tidak perlu lagi -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useJanusRoom } from "@/composable/UseJanusRoom";
import { useGeminiQuiz, type QuizQuestion } from "@/utils/GeminiService";

const router = useRouter();

// Gemini API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const geminiService = useGeminiQuiz(GEMINI_API_KEY);

// Janus
const JANUS_SERVER = import.meta.env.VITE_JANUS_SERVER;
const {
  players,
  messages,
  isHost,
  roomCode,
  username,
  sendMessage,
  leaveRoom,
} = useJanusRoom(JANUS_SERVER);

// ✅ LOAD SETTINGS & CALCULATE TIME PER QUESTION
const savedSettings = JSON.parse(
  localStorage.getItem("gameSettings") || '{"mode":"bahasa","timeLimit":"5"}'
);
const gameCategory = ref(savedSettings.mode);

// ✅ CALCULATE TIME PER QUESTION (Total Time / 10 questions)
const totalGameTime =
  savedSettings.timeLimit === "unlimited"
    ? 600
    : parseInt(savedSettings.timeLimit) * 60;
const timePerQuestion = Math.floor(totalGameTime / 10); // Detik per soal

// Game State
const currentQuestion = ref(1);
const timeLeft = ref(timePerQuestion);
const selectedAnswer = ref<number | null>(null);
const isLoadingQuestion = ref(false);
const showScoreboard = ref(false);
const showFinalResults = ref(false);
const countdownToNext = ref(5);
const myScore = ref(0);

// ✅ REGION SEQUENCE: Pre-determined tapi generate on-demand
const regionSequence = ref<string[]>([]);

const quizData = ref<QuizQuestion>({
  question: "",
  targetWord: "",
  options: [],
  correctAnswer: 0,
  fullTranslation: "",
  category: "",
  region: ""
});

interface PlayerScore {
  username: string;
  score: number;
  lastChange?: number;
}

const playerScores = ref<Map<string, number>>(new Map());
const previousRankings = ref<Map<string, number>>(new Map());

// ✅ Buat region sequence di awal (2 soal per region, diacak)
function createRegionSequence() {
  const regions: string[] = [
    'Javanese (Jawa)',
    'Sundanese (Sunda)', 
    'Balinese (Bali)',
    'Minangkabau (Minang)',
    'Batak'
  ];
  
  const sequence: string[] = [];
  regions.forEach(region => {
    sequence.push(region, region); // 2x per region = 10 total
  });
  
  // Shuffle
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = sequence[i]!;
    sequence[i] = sequence[j]!;
    sequence[j] = temp;
  }
  
  regionSequence.value = sequence;
  console.log('📚 Region sequence created:', sequence);
}

const sortedPlayers = computed(() => {
  const scores: PlayerScore[] = [];
  players.value.forEach((player) => {
    const currentScore = playerScores.value.get(player.username) || 0;
    const prevRank = previousRankings.value.get(player.username) || 999;

    scores.push({
      username: player.username,
      score: currentScore,
      lastChange: 0,
    });
  });

  scores.sort((a, b) => b.score - a.score);

  scores.forEach((player, newRank) => {
    const prevRank = previousRankings.value.get(player.username) || 999;
    player.lastChange = prevRank - newRank;
  });

  return scores;
});

let timerInterval: any = null;

// ✅ Generate quiz untuk soal saat ini saja (ON-DEMAND)
async function generateCurrentQuiz() {
  isLoadingQuestion.value = true;

  try {
    const questionIndex = currentQuestion.value - 1;
    const region = regionSequence.value[questionIndex];
    
    console.log(`📝 Generating question ${currentQuestion.value}/10 for region: ${region}`);
    
    const quiz = await geminiService.generateQuiz(gameCategory.value, region);
    quizData.value = quiz;
    
    console.log(`✅ Question ${currentQuestion.value} loaded: ${quiz.targetWord}`);
  } catch (error) {
    console.error("Failed to generate quiz:", error);
  } finally {
    isLoadingQuestion.value = false;
  }
}

// Timer
function startTimer() {
  timeLeft.value = timePerQuestion;
  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval);
      handleTimeUp();
    }
  }, 1000);
}

function handleTimeUp() {
  // ✅ UPDATE SCORE BARU SETELAH WAKTU HABIS
  if (selectedAnswer.value === null) {
    selectedAnswer.value = -1;
  }

  // ✅ CEK APAKAH JAWABAN BENAR DAN UPDATE SCORE
  if (selectedAnswer.value === quizData.value.correctAnswer) {
    myScore.value += 10;
    playerScores.value.set(username.value, myScore.value);
  }

  // Broadcast hasil ke semua player
  sendMessage(
    JSON.stringify({
      type: "answer_result",
      username: username.value,
      correct: selectedAnswer.value === quizData.value.correctAnswer,
      score: myScore.value, // Send total score
    })
  );

  sortedPlayers.value.forEach((player, index) => {
    previousRankings.value.set(player.username, index);
  });

  setTimeout(() => {
    showScoreboard.value = true;
    startScoreboardCountdown();
  }, 5000);
}

function startScoreboardCountdown() {
  countdownToNext.value = 5;
  const interval = setInterval(() => {
    countdownToNext.value--;
    if (countdownToNext.value <= 0) {
      clearInterval(interval);
      showScoreboard.value = false;

      if (currentQuestion.value >= 10) {
        showFinalResults.value = true;
      } else {
        currentQuestion.value++;
        selectedAnswer.value = null;
        // ✅ Generate soal berikutnya on-the-fly
        generateCurrentQuiz().then(() => {
          startTimer();
        });
      }
    }
  }, 1000);
}

function selectAnswer(index: number) {
  if (timeLeft.value === 0) return;

  // ✅ HANYA SET JAWABAN, JANGAN UPDATE SCORE DULU
  // Kalau ganti jawaban, hapus jawaban lama
  selectedAnswer.value = index;

  // ✅ KIRIM KE SERVER TAPI JANGAN UPDATE SCORE LOCAL DULU
  sendMessage(
    JSON.stringify({
      type: "player_answer",
      username: username.value,
      answer: index,
      correct: index === quizData.value.correctAnswer,
    })
  );
}

function getButtonClass(index: number) {
  if (timeLeft.value === 0) {
    if (index === quizData.value.correctAnswer) {
      return "bg-green-500 text-white ring-4 ring-green-300";
    }
    if (
      selectedAnswer.value === index &&
      index !== quizData.value.correctAnswer
    ) {
      return "bg-red-500 text-white ring-4 ring-red-300";
    }
    return "bg-white bg-opacity-10 text-gray-400 border border-white border-opacity-20";
  }

  if (selectedAnswer.value === index) {
    return "bg-blue-500 text-white ring-4 ring-blue-300";
  }

  return "bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-opacity-30";
}

async function handlePlayAgain() {
  currentQuestion.value = 1;
  myScore.value = 0;
  showFinalResults.value = false;
  playerScores.value.clear();
  previousRankings.value.clear();

  geminiService.resetUsedWords();
  createRegionSequence(); // ✅ Buat sequence baru

  sendMessage(JSON.stringify({ type: "game_restart" }));
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

watch(messages, (newMessages) => {
  newMessages.forEach((msg) => {
    if (msg.type === "chat") {
      try {
        const data = JSON.parse(msg.message);

        // ✅ UPDATE: Terima total score dari player lain
        if (data.type === "answer_result") {
          playerScores.value.set(data.username, data.score);
        }

        if (data.type === "game_restart" && !isHost.value) {
          router.push("/lobby");
        }
      } catch (e) {
        // ignore
      }
    }
  });
});

onMounted(async () => {
  geminiService.resetUsedWords();
  
  // ✅ Buat region sequence dulu (instant, ga perlu API)
  createRegionSequence();

  players.value.forEach((player) => {
    playerScores.value.set(player.username, 0);
    previousRankings.value.set(player.username, 999);
  });

  // ✅ Generate soal pertama saja (cepat ~1-2 detik)
  await generateCurrentQuiz();
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
/* ✅ TRANSITION ANIMATIONS FOR SCOREBOARD */
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
