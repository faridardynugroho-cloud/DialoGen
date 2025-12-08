<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6">
    <!-- Loading Overlay -->
    <div v-if="isLoadingQuestion" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-8 text-center border border-white border-opacity-20">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <p class="text-white text-lg">{{ IS_HOST ? 'Generating question...' : 'Waiting for host...' }}</p>
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
                    index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1
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
                  index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1
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
   <div v-if="!showScoreboard && !showFinalResults" class="relative z-10 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20">
          <p class="text-gray-300 text-sm">Question</p>
          <p class="text-2xl font-bold text-white">{{ currentQuestion }} / 10</p>
        </div>

        <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20">
          <p class="text-gray-300 text-sm">Time</p>
          <p class="text-2xl font-bold" :class="timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'">
            {{ timeLeft }}s
          </p>
        </div>

        <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20">
          <p class="text-gray-300 text-sm">Your Score</p>
          <p class="text-2xl font-bold text-yellow-400">{{ myScore }}</p>
        </div>
      </div>

      <!-- Question Card -->
      <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white border-opacity-20">
        <div class="mb-6">
          <p class="text-gray-300 text-sm mb-2">Soal dalam Bahasa Daerah:</p>
          <h2 class="text-3xl font-bold text-white mb-4">{{ quizData.question }}</h2>
          
          <p class="text-gray-300 text-sm mb-2">Tebak arti kata yang dicetak tebal:</p>
          <p class="text-2xl font-bold text-yellow-400">{{ quizData.targetWord }}</p>
        </div>

        <!-- Translation (shown after time's up) -->
        <div v-if="timeLeft === 0" class="mt-6 pt-6 border-t border-white border-opacity-20 animate-fade-in">
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
            <span v-if="timeLeft === 0 && index === quizData.correctAnswer" class="text-2xl">✓</span>
            <span v-if="selectedAnswer === index && index !== quizData.correctAnswer && timeLeft === 0" class="text-2xl">✗</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// GameView.vue <script setup> - CRITICAL FIX for Empty Username/Room

import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useJanusRoom } from "@/composable/UseJanusRoom";
import { useGeminiQuiz, type QuizQuestion } from "@/utils/GeminiService";

const router = useRouter();

// ✅ CRITICAL FIX 1: Get data from localStorage FIRST
const storedUsername = localStorage.getItem("username") || "";
const storedRoomCode = localStorage.getItem("roomCode") || "";
const storedIsHost = localStorage.getItem("isHost") === "true";

// ✅ Validate before proceeding
if (!storedUsername || !storedRoomCode) {
  console.error("[Game] ❌ Missing username or room code!");
  router.push("/");
}

const IS_HOST = ref(storedIsHost);
Object.freeze(IS_HOST);

// Gemini API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const geminiService = useGeminiQuiz(GEMINI_API_KEY);

// Janus
const JANUS_SERVER = import.meta.env.VITE_JANUS_SERVER;
const { players, messages, roomCode, username, sendMessage, leaveRoom } = useJanusRoom(JANUS_SERVER);

// ✅ CRITICAL FIX 2: Ensure username and roomCode are populated
// Force set if composable hasn't initialized yet
if (!username.value) {
  username.value = storedUsername;
}
if (!roomCode.value) {
  roomCode.value = storedRoomCode;
}

// Settings
const savedSettings = JSON.parse(localStorage.getItem("gameSettings") || '{"mode":"bahasa","timeLimit":"5"}');
const gameCategory = ref(savedSettings.mode);
const totalGameTime = savedSettings.timeLimit === "unlimited" ? 600 : parseInt(savedSettings.timeLimit) * 60;
const timePerQuestion = Math.floor(totalGameTime / 10);

// Game State
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

const playerScores = ref<Record<string, number>>({});
const previousRankings = ref<Record<string, number>>({});
const regionSequence = ref<string[]>([]);

const processedSeqNumbers = new Set<string>();
let isGenerating = false;

function createRegionSequence() {
  if (!IS_HOST.value) return;
  
  const regions: string[] = [
    'Javanese (Jawa)',
    'Sundanese (Sunda)', 
    'Balinese (Bali)',
    'Minangkabau (Minang)',
    'Batak'
  ];
  
  const sequence: string[] = [];
  regions.forEach(region => {
    sequence.push(region, region);
  });
  
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j]!, sequence[i]!];
  }
  
  regionSequence.value = sequence;
  console.log('[Host] Region sequence:', sequence);
}

const sortedPlayers = computed(() => {
  console.log('[Scoreboard] Computing sortedPlayers...', {
    playersCount: players.value.length,
    scoresCount: Object.keys(playerScores.value).length,
    players: players.value.map(p => p.username),
    scores: playerScores.value
  });

  const scores: PlayerScore[] = [];
  
  players.value.forEach((player) => {
    const currentScore = playerScores.value[player.username] ?? 0;
    const prevRank = previousRankings.value[player.username] ?? 999;
    
    scores.push({ 
      username: player.username, 
      score: currentScore, 
      lastChange: 0 
    });
  });

  scores.sort((a, b) => b.score - a.score);
  
  scores.forEach((player, newRank) => {
    const prevRank = previousRankings.value[player.username] ?? 999;
    player.lastChange = prevRank - newRank;
  });

  console.log('[Scoreboard] Sorted players:', scores);
  return scores;
});

let timerInterval: any = null;

// ✅ CRITICAL FIX 3: Use storedUsername for hostId
function broadcastMessage(type: string, data: any = {}) {
  if (!IS_HOST.value) {
    console.error(`[broadcastMessage] BLOCKED! Guest tried to broadcast ${type}`);
    return;
  }
  
  const uniqueSeq = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const message = {
    type,
    ...data,
    seq: uniqueSeq,
    hostId: storedUsername, // ✅ Use stored username instead of reactive
    timestamp: Date.now()
  };
  
  console.log(`[Host] Broadcasting ${type} (seq: ${uniqueSeq})`);
  sendMessage(JSON.stringify(message));
}

async function generateAndBroadcastQuiz() {
  if (!IS_HOST.value) {
    console.error("[generateAndBroadcastQuiz] BLOCKED! Not host!");
    return;
  }
  
  if (isGenerating) {
    console.warn("[generateAndBroadcastQuiz] Already generating, skip!");
    return;
  }
  
  isGenerating = true;
  isLoadingQuestion.value = true;
  console.log(`[Host] 🎯 Generating question ${currentQuestion.value}/10`);

  try {
    const questionIndex = currentQuestion.value - 1;
    const region = regionSequence.value[questionIndex];
    
    const quiz = await geminiService.generateQuiz(gameCategory.value, region);
    console.log(`[Host] ✅ Generated quiz:`, { region, question: quiz.question.substring(0, 50) });
    
    quizData.value = quiz;
    isLoadingQuestion.value = false;
    quizReadyForTimer.value = true;
    
    broadcastMessage("new_question", {
      questionNumber: currentQuestion.value,
      quizData: quiz
    });
    
    console.log(`[Host] 📤 Question ${currentQuestion.value} broadcasted`);
    
  } catch (error) {
    console.error("[Host] ❌ Failed to generate quiz:", error);
    isLoadingQuestion.value = false;
  } finally {
    isGenerating = false;
  }
}

function receiveQuizFromHost(data: any) {
  if (IS_HOST.value) {
    console.log("[Host] Skipping receiveQuizFromHost");
    return;
  }
  
  console.log(`[Guest] 📥 Received question ${data.questionNumber} (seq: ${data.seq})`);
  
  currentQuestion.value = data.questionNumber;
  quizData.value = data.quizData;
  isLoadingQuestion.value = false;
  selectedAnswer.value = null;
  quizReadyForTimer.value = true;
  
  console.log(`[Guest] ✅ Quiz ready for timer`);
}

function startTimer() {
  console.log(`[${IS_HOST.value ? 'Host' : 'Guest'}] ⏱️ Starting timer`);
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
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
  console.log(`[${IS_HOST.value ? 'Host' : 'Guest'}] ⏰ Time's up!`);
  
  if (selectedAnswer.value === null) {
    selectedAnswer.value = -1;
  }

  // ✅ Use storedUsername
  if (selectedAnswer.value === quizData.value.correctAnswer) {
    myScore.value += 10;
    playerScores.value = {
      ...playerScores.value,
      [storedUsername]: myScore.value
    };
    console.log(`[Score] 💯 Updated my score: ${myScore.value}`);
  }

  // Broadcast hasil
  sendMessage(JSON.stringify({
    type: "answer_result",
    username: storedUsername, // ✅ Use stored username
    correct: selectedAnswer.value === quizData.value.correctAnswer,
    score: myScore.value,
    timestamp: Date.now()
  }));

  const newRankings: Record<string, number> = {};
  sortedPlayers.value.forEach((player, index) => {
    newRankings[player.username] = index;
  });
  previousRankings.value = newRankings;

  if (IS_HOST.value) {
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
        if (IS_HOST.value) {
          console.log("[Host] 🏁 Broadcasting game_over");
          broadcastMessage("game_over");
        }
        showFinalResults.value = true;
      } else {
        currentQuestion.value++;
        selectedAnswer.value = null;
        quizReadyForTimer.value = false;
        
        if (IS_HOST.value) {
          console.log(`[Host] 🔄 Generating question ${currentQuestion.value}`);
          generateAndBroadcastQuiz().then(() => {
            setTimeout(() => {
              broadcastMessage("start_timer");
              startTimer();
            }, 500);
          });
        }
      }
    }
  }, 1000);
}

function selectAnswer(index: number) {
  if (timeLeft.value === 0) return;
  selectedAnswer.value = index;

  sendMessage(JSON.stringify({
    type: "player_answer",
    username: storedUsername, // ✅ Use stored username
    answer: index,
    correct: index === quizData.value.correctAnswer,
    timestamp: Date.now()
  }));
}

function getButtonClass(index: number) {
  if (timeLeft.value === 0) {
    if (index === quizData.value.correctAnswer) {
      return "bg-green-500 text-white ring-4 ring-green-300";
    }
    if (selectedAnswer.value === index && index !== quizData.value.correctAnswer) {
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
  
  playerScores.value = {};
  previousRankings.value = {};
  quizReadyForTimer.value = false;

  if (IS_HOST.value) {
    console.log("[Host] 🔄 Restarting game");
    geminiService.resetUsedWords();
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

// ✅ Watch players untuk auto-add ke playerScores
watch(players, (newPlayers) => {
  console.log('[Watch Players] Players updated:', newPlayers.map(p => p.username));
  
  newPlayers.forEach((player) => {
    if (playerScores.value[player.username] === undefined) {
      console.log(`[Watch Players] 🆕 Adding ${player.username} to scores`);
      playerScores.value = {
        ...playerScores.value,
        [player.username]: 0
      };
      previousRankings.value = {
        ...previousRankings.value,
        [player.username]: 999
      };
    }
  });
}, { deep: true, immediate: true });

let lastProcessedIndex = 0;

watch(messages, (newMessages) => {
  const newCount = newMessages.length;
  
  console.log(`[Watch] 📬 Processing ${newCount - lastProcessedIndex} new messages (isHost: ${IS_HOST.value})`);
  
  for (let i = lastProcessedIndex; i < newCount; i++) {
    const msg = newMessages[i];
    if (!msg || msg.type !== "chat") continue;
    
    try {
      const data = JSON.parse(msg.message);
      
      if (data.seq && processedSeqNumbers.has(data.seq)) {
        console.log(`[Dedupe] 🚫 Skipping duplicate seq: ${data.seq}`);
        continue;
      }
      
      if (data.seq) {
        processedSeqNumbers.add(data.seq);
      }
      
      console.log(`[Message #${i}] 📨 Type: ${data.type}, Seq: ${data.seq?.substring(0, 20)}, From: ${msg.sender}, isHost: ${IS_HOST.value}`);
      
      if (!IS_HOST.value) {
        if (data.type === "new_question") {
          console.log("[Guest] 📥 Processing new_question");
          receiveQuizFromHost(data);
        } 
        else if (data.type === "start_timer") {
          console.log("[Guest] ⏱️ Timer signal received");
          
          const attemptStartTimer = () => {
            if (quizReadyForTimer.value) {
              console.log("[Guest] ✅ Quiz ready, starting timer");
              startTimer();
              quizReadyForTimer.value = false;
            } else {
              console.warn("[Guest] ⏳ Quiz not ready, waiting...");
              setTimeout(attemptStartTimer, 200);
            }
          };
          
          attemptStartTimer();
        } 
        else if (data.type === "show_scoreboard") {
          console.log("[Guest] 📊 Showing scoreboard");
          showScoreboard.value = true;
          startScoreboardCountdown();
        } 
        else if (data.type === "game_over") {
          console.log("[Guest] 🏁 Game over");
          showFinalResults.value = true;
        } 
        else if (data.type === "game_restart") {
          console.log("[Guest] 🔄 Restarting");
          router.push("/lobby");
        }
      }
      
      if (data.type === "answer_result" && data.username) {
        console.log(`[Score] 💯 ${data.username}: ${data.score}`);
        playerScores.value = {
          ...playerScores.value,
          [data.username]: data.score
        };
        console.log(`[Score] Current scores:`, playerScores.value);
      }
      
    } catch (e) {
      console.error("[Watch] ❌ Parse error:", e);
    }
  }
  
  lastProcessedIndex = newCount;
}, { deep: true });

onMounted(async () => {
  console.log("=".repeat(60));
  console.log(`[Game] ⚡ MOUNTED as ${IS_HOST.value ? '🔴 HOST' : '🔵 GUEST'}`);
  console.log(`[Game] 👤 Username: ${storedUsername}`); // ✅ Use stored
  console.log(`[Game] 🏠 Room: ${storedRoomCode}`); // ✅ Use stored
  console.log(`[Game] 👥 Initial players:`, players.value.map(p => p.username));
  console.log("=".repeat(60));
  
  // ✅ Wait for players to sync (give it time)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // ✅ Initialize scores including SELF
  const initialScores: Record<string, number> = {
    [storedUsername]: 0 // ✅ Ensure self is included
  };
  const initialRankings: Record<string, number> = {
    [storedUsername]: 999
  };
  
  players.value.forEach((player) => {
    initialScores[player.username] = 0;
    initialRankings[player.username] = 999;
    console.log(`[Init] 🎮 Added ${player.username} to scoreboard`);
  });
  
  playerScores.value = initialScores;
  previousRankings.value = initialRankings;
  
  console.log(`[Init] 📊 Initial scores:`, playerScores.value);

  if (IS_HOST.value) {
    console.log("[Host] 🎮 Initializing as GAME MASTER");
    geminiService.resetUsedWords();
    createRegionSequence();
    
    await generateAndBroadcastQuiz();
    
    setTimeout(() => {
      console.log("[Host] 🚀 Broadcasting start_timer");
      broadcastMessage("start_timer");
      startTimer();
    }, 1000);
  } else {
    isLoadingQuestion.value = true;
    console.log("[Guest] ⏳ Waiting for host...");
  }
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  console.log(`[Game] 👋 Unmounted (${IS_HOST.value ? 'Host' : 'Guest'})`);
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