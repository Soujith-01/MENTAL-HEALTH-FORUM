import axios from 'axios'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
axios.defaults.baseURL = backendUrl
axios.defaults.withCredentials = true
axios.interceptors.request.use(
  (config) => {
    if (typeof config.url === 'string' && config.url.startsWith('')) {
      config.url = config.url.replace('', backendUrl)
    }
    return config
  },
  (error) => Promise.reject(error)
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


