import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { seedDatabase } from './db'
import './style.css'

seedDatabase().then(() => {
  createApp(App).use(router).mount('#app')
}).catch(err => {
  console.error('Database seed failed:', err)
  createApp(App).use(router).mount('#app')
})
