import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/HomeView.vue'
import CreateRoom from '../pages/CreateRoom.vue'
import JoinRoom from '../pages/JoinName.vue'
import LobbyHost from '../pages/LobbyHost.vue'
import LobbyGuest from '../pages/LobbyGuest.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/create-room',
    name: 'create-room',
    component: CreateRoom,
  },
  {
    path: '/join-room',
    name: 'join-room',
    component: JoinRoom,
  },
  {
    path: '/lobby-host',
    name: 'lobby-host',
    component: LobbyHost,
  },
  {
    path: '/lobby-guest',
    name: 'lobby-guest',
    component: LobbyGuest,
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
