<template>
   <div class="min-h-screen flex flex-col justify-start px-6 overflow-hidden relative pb-12"
   style="background: linear-gradient(to bottom, #dc2626 10%, #dc2626 10%, #ffffff 40%, #ffffff 100%);">
    <!-- Animated Background Elements -->
    

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-8 text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <p class="text-white text-lg">{{ status || 'Joining room...' }}</p>
      </div>
    </div>

    <!-- Error Toast -->
    <div v-if="error" class="fixed top-5 right-5 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-right">
      {{ error }}
    </div>

    <!-- Main Card -->
    <div class="absolute left-0">
      <img :src="menuicon" alt="" class="h-40 w-40">
    </div>

    <!-- Bagian Atas: Gambar -->
    <div class="gambar-container w-full flex flex-col justify-center items-center text-center -mt-5 animate-fade-in delay-200">
      <img :src="frame1" class="w-90 md:w-80 lg:w-96 mb-0" />
      <img :src="dialogentext" class=" w-48 md:w-64 mb-0 -mt-24 md:-mt-20 md:mb-10" />
    </div>

     <!-- Room Code Display -->
<div class="room-container shdw w-full mx-auto max-w-md mb-6 backdrop-filter backdrop-blur-lg  rounded-2xl px-4  py-2 shadow-lg animate-slide-up animation-delay-1000 relative">
  <button 
    @click="goBack"
    class="absolute top-5 right-3 w-10 h-10  bg-opacity-20 hover:bg-opacity-30  flex items-center justify-center transition-all"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
  
  <div class="flex items-center gap-3">
    <!-- Icon -->
    <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
      <img :src="cube" alt="">
    </div>
    
    <!-- Text -->
    <div>
      <p class="text-white text-md font-medium opacity-80 mb-0.5">Room Code</p>
      <p class="text-white text-xl font-bold tracking-wide">{{ room }}</p>
    </div>
  </div>
</div>

      <div class="w-full max-w-md mx-auto mb-22 animate-slide-up">

      <h2 class="text-lg font-medium text-black text-left px-2 mb-1">Username</h2>
      
      <!-- Username Input -->
      <div class="mb-1">
        <div class="relative">
          <input 
            v-model="username" 
            @keyup.enter="goLobby"
            :disabled="isLoading"
             class="w-full border-2 border-black text-black border-opacity-30 bg-[#EAEAEA] rounded-xl px-4 py-4 pl-12 placeholder-gray-500 focus:ring-4 focus:ring-red-300 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
            placeholder="Username"
          />
          <div class="absolute inset-y-0 left-0 flex items-center pl-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <div class="mt-2 flex justify-between items-center">
          <p class="text-xs text-gray-800 opacity-70 ml-1">Username akan ditampilkan kepada peserta lain</p>
          <div v-if="username" class="flex items-center text-green-400 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Tersedia
          </div>
        </div>
      </div>

      <!-- Join Button -->
      <button 
        @click="goLobby" 
        :disabled="!username.trim() || isLoading"
       class="w-full py-4 bgred hover:bgred:hover mt-5 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 relative overflow-hidden group"
      >
        <span class="relative z-10 flex items-center justify-center">
          Join Room
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </span>
        <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>

      <!-- Tips -->
      <div
        class="max-w-md bg-white mt-5 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-4 border border-black border-opacity-30 z-10 animate-fade-in animation-delay-1000"
      >
        <div class="flex items-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-yellow-300 mr-2 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-xs text-gray-600">
            Pilih username yang mudah diingat dan unik. Username akan digunakan
            untuk identifikasi Anda dalam sesi quiz.
          </p>
        </div>
      </div>
  
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useJanusRoom } from '../composable/UseJanusRoom'
import frame1 from '@/assets/image/Frame.png'
import dialogentext from '@/assets/image/dialogen.png'
import menuicon from '@/assets/image/iconmenu.png'
import cube from '@/assets/image/cube.svg'


const router = useRouter()
const username = ref('')
const room = ref('')

// Initialize Janus composable
const { 
  init, 
  joinRoom, 
  isLoading, 
  error, 
  status 
} = useJanusRoom()
const isInitializing = ref(false);
const connectionStep = ref('');

// Get room code from URL parameters when component mounts
onMounted(async () => {
  const roomCode = new URLSearchParams(window.location.search).get('code')
  if (roomCode) {
    room.value = roomCode
  } else {
    error.value = 'Kode room tidak ditemukan'
    setTimeout(() => {
      router.push('/')
    }, 2000)
    return
  }

  // Initialize Janus
  try {
    await init()
    console.log('Janus initialized successfully')
  } catch (err) {
    console.error('Failed to initialize Janus:', err)
  }
})

// Watch for errors and show toast
watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      error.value = null
    }, 5000)
  }
})

const goLobby = async () => {
  if (!username.value.trim()) {
    error.value = 'Username tidak boleh kosong!'
    return
  }
  
  try {
    // Join room with Janus
    await joinRoom(room.value, username.value)
    
    // Store data and navigate to lobby
    localStorage.setItem('username', username.value)
    localStorage.setItem('roomCode', room.value)
    localStorage.setItem('isHost', 'false')
    
    router.push('/lobby')
  } catch (err) {
    console.error('Failed to join room:', err)
    error.value = err.message || 'Gagal bergabung ke room'
  }
}

const goBack = () => {
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

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
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

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}

.animate-slide-in-right {
  animation: slide-in-right 0.5s ease-out;
}

.animate-fade-out {
  animation: fade-out 0.5s ease-out forwards;
}

.room-container{
  background-color: #201658;
}

/* Glassmorphism effect */
.backdrop-filter {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Custom scrollbar */
input::-webkit-scrollbar {
  width: 6px;
}

input::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

input::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

input::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.gambar-container{
  margin-bottom: 60px;
}
.bgred {
  background-color: #FF0000;
}
.bgred:hover {
  background-color: #FF0005;
}
.shdw{
  box-shadow: 0 5px 3px rgba(0, 0, 0, 0.5);
}
</style>