<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6 overflow-y-auto relative">
    <!-- Animated Background Elements -->
   

    <div class="relative z-10 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8 animate-fade-in">
        <h1 class="text-4xl font-bold text-white mb-2">Lobby</h1>
        <div class="flex items-center justify-center gap-2">
          <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-300 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <p class="text-xl text-gray-200">Room: {{ roomCode }}</p>
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

        <!-- Room Info & Actions -->
        <div class="space-y-6">
          <!-- Room Info -->
          <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20 animate-slide-up animation-delay-200">
            <h3 class="text-xl font-bold text-white mb-4">Room Info</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-300">Room Code</span>
                <span class="text-white font-medium">{{ roomCode }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Game Mode</span>
                <span class="text-white font-medium">Conversation</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Max Players</span>
                <span class="text-white font-medium">{{ maxPlayers }}</span>
              </div>
            </div>
          </div>

          <!-- Waiting Status -->
          <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20 animate-slide-up animation-delay-400">
            <div class="flex flex-col items-center justify-center">
              <div class="relative mb-4">
                <div class="w-16 h-16 border-4 border-white border-opacity-30 rounded-full"></div>
                <div class="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <p class="text-white text-center">Menunggu host memulai permainan...</p>
            </div>
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

  setInterval(() => {
    if (localStorage.getItem('gameStarted') === 'true') {
      router.push('/game')
    }
  }, 1000)
})


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
</style>