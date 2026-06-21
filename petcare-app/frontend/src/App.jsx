import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { ToastProvider } from './components/Toast'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Pets from './pages/Pets'
import Agendamentos from './pages/Agendamentos'
import Servicos from './pages/Servicos'

const PAGE_TITLES = {
  '/':             { title: 'Dashboard',     sub: 'Visão geral do pet shop' },
  '/clientes':     { title: 'Clientes',      sub: 'Gerenciar base de clientes' },
  '/pets':         { title: 'Pets',          sub: 'Cadastro de animais' },
  '/agendamentos': { title: 'Agendamentos',  sub: 'Agenda de serviços' },
  '/servicos':     { title: 'Serviços',      sub: 'Catálogo de serviços' },
}

function Layout() {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] || { title: 'PetCare', sub: '' }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <h1>{page.title}</h1>
            <span className="topbar-sub">{page.sub}</span>
          </div>
        </div>
        <div className="page-content">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/clientes"     element={<Clientes />} />
            <Route path="/pets"         element={<Pets />} />
            <Route path="/agendamentos" element={<Agendamentos />} />
            <Route path="/servicos"     element={<Servicos />} />
          </Routes>
        </div>
      </div>
      <ToastProvider />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
