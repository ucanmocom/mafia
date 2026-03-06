import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route path="/:lang" element={<App />} />
          <Route path="/" element={<Navigate to="/pl" replace />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)
