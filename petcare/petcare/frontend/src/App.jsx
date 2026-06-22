import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import Clientes from './pages/Clientes'
import Agendamentos from './pages/Agendamentos'
import './App.css'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/pets', label: 'Pets', icon: '🐾' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/agendamentos', label: 'Agendamentos', icon: '📅' },
]

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🐾</span>
          <span className="logo-text">PetCare</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="version-badge">v1.0 • AWS Academy</span>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/agendamentos" element={<Agendamentos />} />
        </Routes>
      </main>
    </div>
  )
}
