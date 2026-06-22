import { useEffect, useState } from 'react'
import { agendamentosAPI, petsAPI, clientesAPI, servicosAPI } from '../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_OPTS = ['pendente', 'confirmado', 'concluido', 'cancelado']

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([])
  const [pets, setPets] = useState([])
  const [clientes, setClientes] = useState([])
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [form, setForm] = useState({
    pet_id: '', pet_nome: '', cliente_id: '', cliente_nome: '',
    servico: '', data_hora: '', preco: '', observacoes: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params = filtroStatus ? { status: filtroStatus } : {}
    Promise.all([
      agendamentosAPI.list(params),
      petsAPI.list(),
      clientesAPI.list(),
      servicosAPI.list(),
    ]).then(([ag, p, c, s]) => {
      setAgendamentos(Array.isArray(ag) ? ag : [])
      setPets(Array.isArray(p) ? p : [])
      setClientes(Array.isArray(c) ? c : [])
      setServicos(Array.isArray(s) ? s : [])
    }).catch(() => {
      setAgendamentos([])
      setPets([])
      setClientes([])
      setServicos([])
    }).finally(() => setLoading(false))
  }

  useEffect(load, [filtroStatus])

  const openModal = () => {
    setForm({ pet_id: '', pet_nome: '', cliente_id: '', cliente_nome: '', servico: '', data_hora: '', preco: '', observacoes: '' })
    setError('')
    setModal(true)
  }

  const onPetChange = (petId) => {
    const pet = pets.find(p => p.id === petId)
    setForm(f => ({ ...f, pet_id: petId, pet_nome: pet?.nome || '' }))
  }

  const onClienteChange = (clienteId) => {
    const c = clientes.find(c => c.id === clienteId)
    setForm(f => ({ ...f, cliente_id: clienteId, cliente_nome: c?.nome || '' }))
  }

  const onServicoChange = (servicoId) => {
    const s = servicos.find(s => s.id === servicoId)
    setForm(f => ({ ...f, servico: servicoId, preco: s?.preco || '' }))
  }

  const save = async () => {
    if (!form.pet_id || !form.servico || !form.data_hora) {
      setError('Pet, serviço e data/hora são obrigatórios')
      return
    }
    setSaving(true)
    try {
      await agendamentosAPI.create({
        ...form,
        preco: form.preco ? parseFloat(form.preco) : 0,
        data_hora: new Date(form.data_hora).toISOString(),
      })
      setModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    await agendamentosAPI.updateStatus(id, status)
    load()
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">{agendamentos.length} agendamento(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 12px' }}
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openModal}>+ Novo Agendamento</button>
        </div>
      </div>

      <div className="card">
        {agendamentos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Nenhum agendamento encontrado.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openModal}>Criar agendamento</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pet</th>
                  <th>Tutor</th>
                  <th>Serviço</th>
                  <th>Data/Hora</th>
                  <th>Preço</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map(ag => (
                  <tr key={ag.id}>
                    <td><strong>{ag.pet_nome || '—'}</strong></td>
                    <td>{ag.cliente_nome || '—'}</td>
                    <td>{servicoLabel(ag.servico)}</td>
                    <td>{format(new Date(ag.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                    <td>{ag.preco ? `R$ ${ag.preco.toFixed(2)}` : '—'}</td>
                    <td><span className={`badge badge-${ag.status}`}>{ag.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {ag.status === 'pendente' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(ag.id, 'confirmado')}>✅</button>
                        )}
                        {ag.status === 'confirmado' && (
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(ag.id, 'concluido')}>🏁</button>
                        )}
                        {ag.status !== 'cancelado' && ag.status !== 'concluido' && (
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(ag.id, 'cancelado')}>✖</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <h2 className="modal-title">📅 Novo Agendamento</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
              ⚡ Ao criar, o sistema publica automaticamente no <strong>SNS</strong> e aciona a <strong>Lambda</strong> via AWS.
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Pet *</label>
                <select className="form-input" value={form.pet_id} onChange={e => onPetChange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.especie})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tutor</label>
                <select className="form-input" value={form.cliente_id} onChange={e => onClienteChange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Serviço *</label>
                <select className="form-input" value={form.servico} onChange={e => onServicoChange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {servicos.map(s => <option key={s.id} value={s.id}>{s.icone} {s.nome} — R$ {s.preco.toFixed(2)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Preço (R$)</label>
                <input className="form-input" type="number" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Data e Hora *</label>
              <input className="form-input" type="datetime-local" value={form.data_hora} onChange={e => setForm({ ...form, data_hora: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="form-input" rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Informações adicionais..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Agendar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function servicoLabel(s) {
  const map = {
    banho: '🛁 Banho', tosa: '✂️ Tosa', banho_tosa: '✨ Banho + Tosa',
    consulta: '🩺 Consulta', vacina: '💉 Vacinação', hotel: '🏨 Hotel'
  }
  return map[s] || s
}
