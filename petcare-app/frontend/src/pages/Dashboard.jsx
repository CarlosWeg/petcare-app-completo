import { useEffect, useState } from 'react'
import { dashboardAPI } from '../api'

const EMPTY_STATS = { clientes: 0, pets: 0, agendamentosHoje: 0, agendamentosMes: 0 }

export default function Dashboard() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardAPI.stats(), dashboardAPI.recent()])
      .then(([s, r]) => { setStats(s); setRecent(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const STATUS_BADGE = {
    agendado:   <span className="badge badge-blue">Agendado</span>,
    confirmado: <span className="badge badge-green">Confirmado</span>,
    concluido:  <span className="badge badge-gray">Concluído</span>,
    cancelado:  <span className="badge badge-red">Cancelado</span>,
  }

  if (loading) return <div className="loading"><div className="spinner"/><p>Carregando dashboard…</p></div>

  return (
    <>
      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><span style={{fontSize:24}}>👤</span></div>
          <div><div className="stat-value">{stats.clientes}</div><div className="stat-label">Clientes</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><span style={{fontSize:24}}>🐾</span></div>
          <div><div className="stat-value">{stats.pets}</div><div className="stat-label">Pets cadastrados</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><span style={{fontSize:24}}>📅</span></div>
          <div><div className="stat-value">{stats.agendamentosHoje}</div><div className="stat-label">Agendamentos hoje</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><span style={{fontSize:24}}>📈</span></div>
          <div><div className="stat-value">{stats.agendamentosMes}</div><div className="stat-label">Agendamentos no mês</div></div>
        </div>
      </div>

      {/* Recent appointments */}
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <h3 className="section-title" style={{margin:0}}>Agendamentos Recentes</h3>
          <span style={{fontSize:12,color:'var(--gray-400)'}}>Últimas 10 entradas</span>
        </div>

        {recent.length === 0
          ? <div className="empty-state"><p>Nenhum agendamento encontrado</p></div>
          : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Pet</th>
                    <th>Serviço</th>
                    <th>Data/Hora</th>
                    <th>Status</th>
                    <th>Tutor</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div className="pet-name">
                          <span className="pet-icon">{a.pet?.tipo === 'gato' ? '🐱' : a.pet?.tipo === 'ave' ? '🦜' : '🐶'}</span>
                          <span>{a.pet?.nome || '—'}</span>
                        </div>
                      </td>
                      <td>{a.servico}</td>
                      <td>{a.data ? new Date(a.data).toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'}) : '—'}</td>
                      <td>{STATUS_BADGE[a.status] || <span className="badge badge-gray">{a.status}</span>}</td>
                      <td>{a.pet?.cliente?.nome || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Architecture info */}
      <div className="grid-2" style={{marginTop:16}}>
        <div className="card">
          <h3 className="section-title">☁️ Infraestrutura AWS</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              ['Cluster K3s',  '3 nodes (1 master + 2 workers)', 'badge-green'],
              ['SQS Queue',    'petcare-agendamentos-queue', 'badge-blue'],
              ['SNS Topic',    'petcare-agendamentos-topic', 'badge-blue'],
              ['Lambda',       'processar-agendamento (Python)', 'badge-yellow'],
              ['MongoDB',      'StatefulSet — 3 réplicas', 'badge-green'],
              ['Redis',        'Cache de sessão', 'badge-green'],
              ['S3 Bucket',    'pet-images (privado)', 'badge-gray'],
            ].map(([k, v, badge]) => (
              <div key={k} style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                <span className={`badge ${badge}`} style={{minWidth:100}}>{k}</span>
                <span style={{color:'var(--gray-600)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="section-title">🔄 Fluxo de Mensageria</h3>
          <div style={{fontFamily:'monospace',fontSize:12,lineHeight:2,color:'var(--gray-600)',background:'var(--gray-50)',padding:16,borderRadius:'var(--radius)'}}>
            <div>📱 Frontend</div>
            <div style={{paddingLeft:12}}>↓ POST /api/agendamentos</div>
            <div>⚙️ Backend (Node.js)</div>
            <div style={{paddingLeft:12}}>↓ Publish → SNS Topic</div>
            <div>📢 SNS Topic</div>
            <div style={{paddingLeft:12}}>↓ Fan-out → SQS Queue</div>
            <div>📬 SQS Queue</div>
            <div style={{paddingLeft:12}}>↓ Poll → Worker Pod (K8s)</div>
            <div>🔧 Worker → Lambda</div>
            <div style={{paddingLeft:12}}>↓ Logs → CloudWatch</div>
          </div>
        </div>
      </div>
    </>
  )
}
