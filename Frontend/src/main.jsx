import axios from 'axios'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://mhf-backend-1.onrender.com'
axios.defaults.baseURL = backendUrl
axios.defaults.withCredentials = true

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


