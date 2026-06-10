import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/index.css'
import './lib/theme' // 初始化主题（读取持久化、设置 data-theme）

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
