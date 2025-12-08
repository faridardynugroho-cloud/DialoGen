<script setup>
import { ref } from "vue"

const activeTab = ref("daily")

// contoh data static
const topPlayers = [
  { rank: 2, name: "Masuma", points: 1490, img: "https://i.pravatar.cc/60?img=11" },
  { rank: 1, name: "Hasan Sajjad", points: 1800, img: "https://i.pravatar.cc/60?img=12" },
  { rank: 3, name: "Tanvir", points: 1205, img: "https://i.pravatar.cc/60?img=13" },
]

const leaderboard = [
  { rank: 4, name: "Tanim", points: 1000, img: "https://i.pravatar.cc/60?img=14" },
  { rank: 5, name: "Sumaiya", points: 900, img: "https://i.pravatar.cc/60?img=15" },
  { rank: 6, name: "Sajjad (You)", points: 800, img: "https://i.pravatar.cc/60?img=16" },
  { rank: 7, name: "Dico Boy", points: 750, img: "https://i.pravatar.cc/60?img=17" },
  { rank: 8, name: "Nazir", points: 720, img: "https://i.pravatar.cc/60?img=18" },
]
</script>

<template>
  <div class="min-h-screen bg-white px-5 py-6 text-black">

    <!-- TITLE -->
    <h1 class="text-2xl font-bold text-center">Leaderboard</h1>

    <!-- TOP 3 -->
    <div class="flex justify-center items-end gap-5 mt-10">

      <!-- Rank 2 -->
      <div class="flex flex-col items-center">
        <img :src="topPlayers[0].img" class="w-16 h-16 rounded-full border-4 border-purple-300" />
        <p class="mt-2 font-medium text-sm">{{ topPlayers[0].name }}</p>
        <p class="text-xs">{{ topPlayers[0].points }} pts</p>
      </div>

      <!-- Rank 1 -->
      <div class="flex flex-col items-center">
        <div class="relative">
          <img :src="topPlayers[1].img" class="w-20 h-20 rounded-full border-4 border-yellow-400" />
          <span class="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</span>
        </div>
        <p class="mt-2 font-bold">{{ topPlayers[1].name }}</p>
        <p class="text-sm">{{ topPlayers[1].points }} pts</p>
      </div>

      <!-- Rank 3 -->
      <div class="flex flex-col items-center">
        <img :src="topPlayers[2].img" class="w-16 h-16 rounded-full border-4 border-purple-300" />
        <p class="mt-2 font-medium text-sm">{{ topPlayers[2].name }}</p>
        <p class="text-xs">{{ topPlayers[2].points }} pts</p>
      </div>

    </div>

    <!-- LIST LEADERBOARD -->
<!-- LIST LEADERBOARD -->
<div class="mt-10 space-y-3">
  <div
    v-for="player in leaderboard"
    :key="player.rank"
    class="flex items-center justify-between 
           px-4 py-4 rounded-xl shadow-md
           bg-gradient-to-r from-[#A18CFF] to-[#6C63FF]
           text-black"
  >
    <!-- Rank + Avatar + Name -->
    <div class="flex items-center gap-3">
      <span class="bg-white text-[#6C63FF] rounded-full px-3 py-1 font-bold shadow">
        {{ player.rank }}
      </span>
      <img :src="player.img" class="w-10 h-10 rounded-full" />
      <span class="font-semibold">{{ player.name }}</span>
    </div>

    <!-- Points -->
    <span class="font-bold opacity-90">
      {{ player.points }} points
    </span>
  </div>
</div>



  </div>
</template>
