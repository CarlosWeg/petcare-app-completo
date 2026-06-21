import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/',              label: 'Dashboard',     icon: '📊' },
  { path: '/clientes',      label: 'Clientes',      icon: '👤' },
  { path: '/pets',          label: 'Pets',          icon: '🐾' },
  { path: '/agendamentos',  label: 'Agendamentos',  icon: '📅' },
  { path: '/servicos',      label: 'Serviços',      icon: '✂️' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ fontSize: 28 }}>🐾</div>
        <div>
          <span>PetCare</span>
          <small>Gestão de Pet Shop</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>PetCare Cloud v1.0</div>
        <div>AWS · K3s · MongoDB</div>
      </div>
    </aside>
  )
}
