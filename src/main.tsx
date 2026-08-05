import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/auth'
import { EmpresaProvider } from './lib/empresa'
import { NegocioProvider } from './lib/negocio'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EmpresaProvider>
          <NegocioProvider>
            <App />
          </NegocioProvider>
        </EmpresaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
