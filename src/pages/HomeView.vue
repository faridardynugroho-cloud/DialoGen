<template>
  <div
    class="min-h-screen flex flex-col items-center justify-between px-6 md:px-10 lg:px-20 overflow-hidden relative animate-fade-in animate-gradient-smooth"
    style="
      background: linear-gradient(
        to bottom,
        #dc2626 10%,
        #dc2626 10%,
        #ffffff 40%,
        #ffffff 100%
      );
    "
  >
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
    >
      <div
        class="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center animate-scale-in"
      >
        <div
          class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-white text-lg">
          {{ status || "Connecting to Server..." }}
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
      <img :src="menuicon" alt="" class="h-24 w-24" />
    </div>

    <!-- Logo -->
    <div
      class="w-full flex flex-col justify-center items-center text-center -mt-5 md:mt-16 lg:-mt-36 animate-fade-in delay-200"
    >
      <img :src="frame" class="w-90 md:w-80 lg:w-96 mb-0" />
      <img :src="dialogentext" class="w-48 md:w-64 -mt-16 md:-mt-20" />

      <div class="text-center mt-10 md:mt-6 animate-fade-in delay-300">
        <h1 class="text-xl md:text-2xl text-black">
          Welcome to <span class="font-bold"> DialoGenQuiz!</span>
        </h1>
        <p class="text-xl md:text-base text-black font-medium opacity-80">
          Play, Learn, and Explore Local Languages with Fun!
        </p>
      </div>
    </div>

    <!-- TITLE -->

    <!-- CARD BUTTONS RESPONSIVE -->
    <div
      class="flex flex-col gap-4 w-full max-w-md mt-10 mb-60 md:mt-10 animate-fade-in delay-500 relative"
    >
      <!-- Create Room -->
      <div class="text-center group">
        <button
          @click="goCreate"
          :disabled="isLoading"
          class="button-addroom w-full py-4 bgblue hover:bg-gray-300  rounded-2xl text-lg text-white font-bold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95"
        >
          Create Room
        </button>
        <p class="mt-3 text-sm text-gray-800 opacity-80">
          Buat ruang percakapan baru untuk memulai sesi.
        </p>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-4 my-2">
        <div
          class="w-full h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"
        ></div>
        <span class="text-gray-800 text-sm font-medium">or</span>
        <div
          class="w-full h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"
        ></div>
      </div>

      <!-- Join Room Button -->
      <div class="text-center group">
        <button
          @click="toggleJoin"
          :disabled="isLoading"
          class="button-join w-full py-4 text-white rounded-2xl text-lg font-bold transition-all duration-300 ease-out hover:bg-red-500 hover:scale-[1.02] active:scale-95"
        >
          Join Room
        </button>
        <p class="mt-3 text-sm text-gray-800 opacity-80">
          Masuk ke ruang percakapan yang sudah dibuat.
        </p>
      </div>
      <!-- JOIN PANEL -->
      <transition name="smooth-slide">
        <div
          v-if="showJoin"
          class="shdow absolute top-full left-0 right-0 mt-4 px-4 py-4 bg-gradient-to-b from-red-500 to-white rounded-2xl backdrop-blur-md z-10"
        >
          <div class="relative">
            <input
              v-model="roomCode"
              @keyup.enter="goJoin"
              :disabled="isLoading"
              placeholder="Masukkan kode room..."
              class="w-full border-2 border-black border-opacity-30 bg-white rounded-xl px-4 py-2 text-black placeholder-gray-500 transition-all focus:border-black focus:ring-2 focus:ring-red-400"
            />

            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>

          <button
            @click="goJoin"
            :disabled="isLoading"
            class="button-join w-full mt-2 py-2 text-white rounded-xl font-bold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95"
          >
            Join Now
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useJanusRoom } from "../composable/UseJanusRoom";
import frame from "@/assets/image/Frame.png";
import dialogentext from "@/assets/image/dialogen.png";
import menuicon from "@/assets/image/iconmenu.png";

const router = useRouter();
const showJoin = ref(false);
const roomCode = ref("");

const { init, isLoading, error, status } = useJanusRoom();

onMounted(async () => {
  try {
    await init();
  } catch (err) {
    console.error("Failed to initialize Janus:", err);
  }
});

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      error.value = null;
    }, 5000);
  }
});

const goCreate = () => {
  if (isLoading.value) return;
  router.push("/create-room");
};

const toggleJoin = () => {
  if (isLoading.value) return;
  showJoin.value = !showJoin.value;
};

const goJoin = () => {
  if (!roomCode.value.trim()) {
    error.value = "Kode room tidak boleh kosong!";
    return;
  }

  if (isLoading.value) return;

  router.push(`/join-room?code=${roomCode.value}`);
};
</script>

<style>
/* KEYFRAMES */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
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

/* ANIMATION UTILITIES */
.animate-fade-in {
  animation: fade-in 0.9s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.4s ease-out;
}

.animate-slide-in-right {
  animation: slide-in-right 0.5s ease-out;
}

.animate-gradient-smooth {
  background-size: 200% 200%;
  animation: gradient 8s ease infinite;
}

/* JOIN PANEL SMOOTH SLIDE */
.smooth-slide-enter-active,
.smooth-slide-leave-active {
  transition: all 0.4s ease;
}

.smooth-slide-enter-from,
.smooth-slide-leave-to {
  opacity: 0;
  transform: translateY(-25px);
}

.smooth-slide-enter-to,
.smooth-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.button-join {
  background-color: #ff0000;
}

.button-addroom {
  background-color: #eaeaea;
}
.bgblue{
  background-color: #201658;
}
.shdow{
  box-shadow: 0 4px 5px rgba(0, 0, 0, 0.2);
}
</style>
