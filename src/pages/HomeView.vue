<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 px-6 overflow-hidden relative">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    </div>

    <!-- Logo / Title -->
    <div class="text-center mb-8 z-10 animate-fade-in">
      <h1 class="text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-2 relative">
        DIA<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 animate-gradient">LOGEN</span>
        <span class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></span>
      </h1>
      <p class="mt-4 text-gray-200 text-xl md:text-2xl font-light">
        Real-time Learning Conversation Platform
      </p>
    </div>

    <!-- Card -->
    <div class="w-full max-w-md bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-3xl p-8 border border-white border-opacity-20 shadow-2xl z-10 animate-slide-up">
      <div class="flex flex-col gap-6">

        <!-- Create Room -->
        <div class="text-center group">
          <button
            @click="goCreate"
            class="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 relative overflow-hidden"
          >
            <span class="relative z-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Room
            </span>
            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          <p class="mt-3 text-sm text-gray-200 opacity-80">
            Buat ruang percakapan baru untuk memulai sesi.
          </p>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-4 my-2">
          <div class="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span class="text-gray-200 text-sm font-medium">or</span>
          <div class="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        <!-- Join Room -->
        <div class="text-center group">
          <button
            @click="toggleJoin"
            class="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-50 relative overflow-hidden"
          >
            <span class="relative z-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Join Room
            </span>
            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>

          <!-- Input code muncul setelah klik Join Room -->
          <transition name="slide-down">
            <div v-if="showJoin" class="mt-6 p-4 bg-white bg-opacity-10 rounded-2xl backdrop-filter backdrop-blur-md">
              <div class="relative">
                <input
                  v-model="roomCode"
                  @keyup.enter="goJoin"
                  placeholder="Masukkan kode room..."
                  class="w-full border-2 border-white border-opacity-30 bg-white bg-opacity-10 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:ring-4 focus:ring-green-300 focus:ring-opacity-50 focus:outline-none transition-all duration-300"
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <button
                @click="goJoin"
                class="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-50"
              >
                Join Now
              </button>
            </div>
          </transition>

          <p class="mt-3 text-sm text-gray-200 opacity-80">
            Masuk ke ruang percakapan yang sudah dibuat.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="mt-10 text-gray-300 text-sm z-10 animate-fade-in animation-delay-1000">
      © 2025 Dialogen. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const showJoin = ref(false)
const roomCode = ref("")

const goCreate = () => router.push("/create-room")
const toggleJoin = () => {
  showJoin.value = !showJoin.value
}
const goJoin = () => {
  if (!roomCode.value.trim()) return
  
  router.push(`/join-room?code=${roomCode.value}`)
}
</script>

<style>
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

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
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

@keyframes slide-down {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 300px;
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

.animation-delay-1000 {
  animation-delay: 1s;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}

.slide-down-enter-active {
  transition: all 0.5s ease;
}

.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-20px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 300px;
  transform: translateY(0);
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
</style>