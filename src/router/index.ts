import { createRouter, createWebHistory } from "vue-router";

// Pages
import Home from "../pages/HomeView.vue";
import CreateRoom from "../pages/CreateRoom.vue";
import JoinRoom from "../pages/JoinRoom.vue";
import Lobby from "../pages/Lobby.vue";
import Game from "../pages/GamePage.vue";
import FinalScore from "../pages/finalscore.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
  },
  {
    path: "/gamestart",
    name: "gamestart",
    component: Game,
  },
  {
    path: "/create-room",
    name: "create-room",
    component: CreateRoom,
  },
  {
    path: "/join-room",
    name: "join-room",
    component: JoinRoom,
    beforeEnter: (to: any, from: any, next: any) => {
      // Check if room code exists in query parameter
      if (!to.query.code) {
        console.warn("[Router] No room code provided, redirecting to home");
        next("/");
      } else {
        next();
      }
    },
  },
  {
    path: "/lobby",
    name: "lobby",
    component: Lobby,
    beforeEnter: (to: any, from: any, next: any) => {
      // Check if user has joined/created a room
      const roomCode = localStorage.getItem("roomCode");
      const username = localStorage.getItem("username");
      const isHost = localStorage.getItem("isHost");

      if (!roomCode || !username) {
        console.warn("[Router] No room session found, redirecting to home");
        next("/");
      } else {
        console.log(
          `[Router] Access granted to lobby: ${roomCode} as ${username} (host: ${isHost})`
        );
        next();
      }
    },
  },
  {
    path: "/game",
    name: "game",
    component: Game,
    beforeEnter: (to: any, from: any, next: any) => {
      // Check if game has started
      const gameStarted = localStorage.getItem("gameStarted");
      const roomCode = localStorage.getItem("roomCode");
      const username = localStorage.getItem("username");

      if (!gameStarted || gameStarted !== "true") {
        console.warn("[Router] Game not started, redirecting to lobby");
        next("/lobby");
      } else if (!roomCode || !username) {
        console.warn("[Router] No room session found, redirecting to home");
        next("/");
      } else {
        console.log(`[Router] Access granted to game: ${roomCode}`);
        next();
      }
    },
  },
  {
    path: "/finalscore",
    name: "FinalScore",
    component: FinalScore,
  },

  {
    // Catch all 404
    path: "/:pathMatch(.*)*",
    name: "not-found",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Global navigation guards
router.beforeEach((to, from, next) => {
  console.log("=".repeat(60));
  console.log(`[Router] Navigation: ${from.path} → ${to.path}`);
  console.log("[Router] 📦 localStorage State:", {
    username: localStorage.getItem("username"),
    roomCode: localStorage.getItem("roomCode"),
    isHost: localStorage.getItem("isHost"),
    gameStarted: localStorage.getItem("gameStarted"),
    gameSettings: localStorage.getItem("gameSettings"),
  });
  console.log("=".repeat(60));
  next();
});

// Clear game state when leaving game page
router.afterEach((to, from) => {
  if (from.name === "game" && to.name !== "game") {
    console.log("[Router] Leaving game, clearing gameStarted flag");
    localStorage.removeItem("gameStarted");
    localStorage.removeItem("gameSettings");
  }
});

export default router;
