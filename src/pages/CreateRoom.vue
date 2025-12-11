<template>
  <div
    class="min-h-screen flex flex-col justify-between px-6 overflow-hidden relative pb-12"
    style="
      background: linear-gradient(
        to bottom,
        #dc2626 2%,
        #dc2626 2%,
        #ffffff 40%,
        #ffffff 100%
      );
    "
  >
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-8 text-center"
      >
        <div
          class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-white text-lg">
          {{ status || "Initializing Janus..." }}
        </p>
      </div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="error"
      class="fixed top-5 right-5 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-right"
    >
      {{ error }}
    </div>

    <div class="absolute left-0">
      <img :src="menuicon" alt="" class="h-40 w-40" />
    </div>

    <!-- Bagian Atas: Gambar -->
    <div
      class="w-full flex flex-col justify-center items-center text-center -mt-5 animate-fade-in delay-200"
    >
      <img :src="frame1" class="w-90 md:w-80 lg:w-96 mb-0" />
      <img
        :src="dialogentext"
        class="w-48 md:w-64 mb-32 -mt-24 md:-mt-20 md:mb-10"
      />
    </div>

    <!-- Bagian Bawah (Input + Button) -->
    <div class="w-full max-w-md mx-auto mb-40 animate-slide-up">
      <h2 class="text-lg font-medium text-black text-left px-2 mb-1">
        Username
      </h2>

      <!-- Username Input -->
      <div class="mb-1">
        <div class="relative">
          <input
            v-model="username"
            @keyup.enter="next"
            :disabled="isLoading"
            class="w-full border-2 border-black text-black border-opacity-30 bg-[#EAEAEA] rounded-xl px-4 py-4 pl-12 placeholder-gray-500 focus:ring-4 focus:ring-red-300 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Username"
          />
          <div class="absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        <div class="mt-2 flex justify-between items-center">
          <p class="text-xs text-gray-800 opacity-70 ml-1">
            Username akan ditampilkan kepada peserta lain
          </p>
          <div v-if="username" class="flex items-center text-green-400 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
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
            Tersedia
          </div>
        </div>
      </div>

      <!-- Next Button -->
      <button
        @click="next"
        :disabled="!username.trim() || isLoading"
        class="w-full py-4 bgblue hover:bgblue:hover mt-5 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 relative overflow-hidden group"
      >
        <span class="relative z-10 flex items-center justify-center">
          Lanjutkan
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform"
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
        <div
          class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        ></div>
      </button>

      <!-- Tips -->
      <div
        class="max-w-md bg-white mt-5 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-4 border border-gray border-opacity-80 z-10 animate-fade-in animation-delay-1000"
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
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useJanusRoom } from "../composable/UseJanusRoom";
import frame1 from "@/assets/image/Frame.png";
import dialogentext from "@/assets/image/dialogen.png";
import menuicon from "@/assets/image/iconmenu.png";

const router = useRouter();
const username = ref("");

// Janus composable
const { init, createRoom, isLoading, error, status } = useJanusRoom();

// Init Janus
onMounted(async () => {
  try {
    await init();
  } catch (err) {
    console.error("Janus init failed:", err);
  }
});

// Remove toast after delay
watch(error, (val) => {
  if (val) {
    setTimeout(() => (error.value = null), 5000);
  }
});

// Next button logic
const next = async () => {
  if (!username.value.trim()) {
    error.value = "Username tidak boleh kosong!";
    return;
  }

  try {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await createRoom(roomCode, username.value);

    localStorage.setItem("username", username.value);
    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("isHost", "true");

    router.push("/lobby");
  } catch (err) {
    error.value = err.message || "Gagal membuat room";
  }
};
</script>

<style scoped>
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
.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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
.animate-slide-in-right {
  animation: slide-in-right 0.5s ease-out;
}

.backdrop-filter {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.animate-fade-in {
  animation: fade-in 1s ease-out;
}
.bgred {
  background-color: #ff0000;
}
.bgred:hover {
  background-color: #ff0005;
}
.bgblue {
  background-color: #201658;
}
.bgblue:hover {
  background-color: #201661;
}
</style>
