<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6 overflow-hidden relative">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    </div>

    <div class="relative z-10 max-w-4xl mx-auto">
      <!-- Header with Room Code -->
      <div class="text-center mb-8 animate-fade-in">
        <h1 class="text-4xl font-bold text-white mb-4">Host Lobby</h1>
        <div class="inline-flex items-center bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl px-6 py-3 border border-white border-opacity-20">
          <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-300 rounded-full flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div class="text-left">
            <p class="text-gray-300 text-sm">Room Code</p>
            <p class="text-2xl font-bold text-white">{{ roomCode }}</p>
          </div>
          
          <button @click="copyRoomCode" class="ml-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <div v-if="showCopyNotification" class="mt-2 text-green-400 text-sm animate-fade-in">
          Room code copied to clipboard!
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Players List -->
        <div class="md:col-span-2 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20 animate-slide-up">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Players</h2>
            <div class="bg-white bg-opacity-20 rounded-full px-3 py-1 text-white text-sm">
              {{ players.length }}/{{ maxPlayers }}
            </div>
          </div>
          
          <ul class="space-y-3">
            <li v-for="(player, index) in players" :key="index" class="bg-white bg-opacity-10 backdrop-filter backdrop-blur rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:bg-opacity-20 transform hover:scale-102">
              <div class="flex items-center">
                <div class="relative mr-4">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center shadow-md">
                    <span class="text-white font-bold">{{ player.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div v-if="player.isHost" class="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div v-else class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-white font-medium">{{ player.name }}</p>
                  <p class="text-gray-300 text-sm">{{ player.isHost ? 'Host' : 'Player' }}</p>
                </div>
              </div>
              <div class="flex items-center">
                <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span class="text-green-400 text-sm">Online</span>
              </div>
            </li>
            
            <!-- Empty slots -->
            <li v-for="n in (maxPlayers - players.length)" :key="'empty-' + n" class="bg-white bg-opacity-5 border-2 border-dashed border-white border-opacity-20 rounded-xl p-4 flex items-center justify-center">
              <p class="text-gray-400">Waiting for player...</p>
            </li>
          </ul>
        </div>

        <!-- Game Settings & Actions -->
        <div class="space-y-6">
          <!-- Game Settings -->
          <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20 animate-slide-up animation-delay-200">
            <h3 class="text-xl font-bold text-white mb-4">Game Settings</h3>
            <div class="space-y-4">
              <div>
                <label class="text-gray-300 text-sm block mb-2">Game Mode</label>
                <select class="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="conversation">Conversation</option>
                  <option value="debate">Debate</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
              <div>
                <label class="text-gray-300 text-sm block mb-2">Time Limit</label>
                <select class="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="unlimited">No limit</option>
                </select>
              </div>
              <div>
                <label class="text-gray-300 text-sm block mb-2">Max Players</label>
                <div class="flex items-center">
                  <button @click="decreaseMaxPlayers" class="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white hover:bg-opacity-30 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <span class="mx-4 text-white font-medium">{{ maxPlayers }}</span>
                  <button @click="increaseMaxPlayers" class="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white hover:bg-opacity-30 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Start Game Button -->
          <button 
            @click="startGame" 
            :disabled="players.length < 2"
            class="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-50 relative overflow-hidden group animate-slide-up animation-delay-400"
          >
            <span class="relative z-10 flex items-center justify-center">
              Start Game
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          
          <div v-if="players.length < 2" class="text-center text-yellow-300 text-sm animate-slide-up animation-delay-400">
            At least 2 players are required to start the game
          </div>

          <!-- Leave Room Button -->
          <button @click="leaveRoom" class="w-full py-3 bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 focus:ring-opacity-50 animate-slide-up animation-delay-600">
            Leave Room
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roomCode = ref('ABCD-1234')
const maxPlayers = ref(6)
const showCopyNotification = ref(false)
const players = ref([
  { name: 'Ardi', isHost: true },
  { name: 'Rani', isHost: false }
])

// Simulate players joining
onMounted(() => {
  // Get room code and username from localStorage
  const savedRoomCode = localStorage.getItem('roomCode')
  const username = localStorage.getItem('username')
  
  if (savedRoomCode) roomCode.value = savedRoomCode
  
  // Simulate new players joining after a delay
  setTimeout(() => {
    if (players.value.length < maxPlayers.value) {
      players.value.push({ name: 'Budi', isHost: false })
    }
  }, 3000)
  
  setTimeout(() => {
    if (players.value.length < maxPlayers.value) {
      players.value.push({ name: 'Siti', isHost: false })
    }
  }, 6000)
  
  setTimeout(() => {
    if (players.value.length < maxPlayers.value) {
      players.value.push({ name: 'Joko', isHost: false })
    }
  }, 9000)
})

const copyRoomCode = () => {
  navigator.clipboard.writeText(roomCode.value)
  showCopyNotification.value = true
  setTimeout(() => {
    showCopyNotification.value = false
  }, 3000)
}

const increaseMaxPlayers = () => {
  if (maxPlayers.value < 10) {
    maxPlayers.value++
  }
}

const decreaseMaxPlayers = () => {
  if (maxPlayers.value > players.value.length) {
    maxPlayers.value--
  }
}

const startGame = () => {
  // Store game settings in localStorage
  localStorage.setItem('gameStarted', 'true')
  router.push('/game')
}

const leaveRoom = () => {
  // Clear localStorage and navigate back
  localStorage.removeItem('roomCode')
  localStorage.removeItem('username')
  router.push('/')
}
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