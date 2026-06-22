import { useEffect, useState } from 'react'
import { statsAPI, agendamentosAPI } from '../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const SERVICO_CORES = {
  banho: '#7C3AED',
  tosa: '#F59E0B',
  banho_tosa: '#10B981',
  consulta: '#3B82F6',
  vacina: '#EF4444',
  hotel: '#EC4899',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsAPI.get(),
      agendamentosAPI.list()
    ]).then(([s, ag]) => {
      setStats(s)
      setAgendamentos(Array.isArray(ag) ? ag : [])
    }).catch(() => {
      setAgendamentos([])
    }).finally(() => setLoading(false))
  }, [])

  // Agrupa agendamentos por serviço para gráfico
  // Garante que chartData seja sempre um array com valores numéricos válidos
  const agendamentosLista = Array.isArray(agendamentos) ? agendamentos : []

  const porServico = agendamentosLista.reduce((acc, ag) => {
    const servico = ag.servico || 'outros'
    acc[servico] = (acc[servico] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(porServico)
    .map(([name, value]) => ({
      name: String(name).replace('_', ' '),
      quantidade: Number(value) || 0,
      fill: SERVICO_CORES[name] || '#7C3AED'
    }))
    .filter(entry => entry.quantidade > 0)

  const proximos = agendamentosLista
    .filter(a => a.data_hora && new Date(a.data_hora) >= new Date() && a.status !== 'cancelado')
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
    .slice(0, 5)

  if (loading) return <div className="loading">Carregando dashboard...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do PetCare</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="🐾" value={stats?.total_pets ?? 0} label="Pets Cadastrados" color="#7C3AED" />
        <StatCard icon="👥" value={stats?.total_clientes ?? 0} label="Clientes" color="#3B82F6" />
        <StatCard icon="📅" value={stats?.total_agendamentos ?? 0} label="Total de Agendamentos" color="#F59E0B" />
        <StatCard icon="📆" value={stats?.agendamentos_hoje ?? 0} label="Agendamentos Hoje" color="#10B981" />
        <StatCard icon="💰" value={`R$ ${Number(stats?.receita_mes ?? 0).toFixed(2)}`} label="Receita do Mês" color="#EC4899" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Gráfico de serviços */}
        <div className="card">
          <p className="card-title">Agendamentos por Serviço</p>
          {chartData.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div>Nenhum agendamento ainda</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Próximos agendamentos */}
        <div className="card">
          <p className="card-title">Próximos Agendamentos</p>
          {proximos.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div>Nenhum agendamento futuro</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {proximos.map((ag, i) => (
                <div key={ag.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: 'var(--bg)', borderRadius: 8
                }}>
                  <div style={{ fontSize: 24 }}>🐾</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ag.pet_nome || 'Pet'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ag.servico} · {ag.data_hora ? format(new Date(ag.data_hora), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                    </div>
                  </div>
                  <span className={`badge badge-${ag.status}`}>{ag.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
