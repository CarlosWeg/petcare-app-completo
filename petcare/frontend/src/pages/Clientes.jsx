import { useEffect, useState } from 'react'
import { clientesAPI } from '../services/api'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', endereco: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => clientesAPI.list()
    .then(c => setClientes(Array.isArray(c) ? c : []))
    .catch(() => setClientes([]))
    .finally(() => setLoading(false))
  useEffect(load, [])

  const openModal = () => {
    setForm({ nome: '', email: '', telefone: '', endereco: '' })
    setError('')
    setModal(true)
  }

  const save = async () => {
    if (!form.nome || !form.email) { setError('Nome e e-mail são obrigatórios'); return }
    setSaving(true)
    try {
      await clientesAPI.create(form)
      setModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ Novo Cliente</button>
      </div>

      <div className="card">
        {clientes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>Nenhum cliente cadastrado.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openModal}>Cadastrar primeiro cliente</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Endereço</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nome}</strong></td>
                    <td>{c.email}</td>
                    <td>{c.telefone || '—'}</td>
                    <td>{c.endereco || '—'}</td>
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
            <h2 className="modal-title">👤 Novo Cliente</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-input" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(49) 99999-9999" />
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input className="form-input" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar Cliente'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
