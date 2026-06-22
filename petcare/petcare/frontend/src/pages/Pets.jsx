import { useEffect, useState } from 'react'
import { petsAPI, clientesAPI } from '../services/api'

const ESPECIES = ['Cão', 'Gato', 'Ave', 'Réptil', 'Roedor', 'Outro']

export default function Pets() {
  const [pets, setPets] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', especie: 'Cão', raca: '', peso: '', cliente_id: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    Promise.all([petsAPI.list(), clientesAPI.list()])
      .then(([p, c]) => { setPets(p); setClientes(c) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openModal = () => {
    setForm({ nome: '', especie: 'Cão', raca: '', peso: '', cliente_id: '' })
    setError('')
    setModal(true)
  }

  const save = async () => {
    if (!form.nome || !form.especie) { setError('Nome e espécie são obrigatórios'); return }
    setSaving(true)
    try {
      await petsAPI.create({
        ...form,
        peso: form.peso ? parseFloat(form.peso) : 0,
      })
      setModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Remover este pet?')) return
    await petsAPI.delete(id)
    load()
  }

  const clienteNome = (id) => clientes.find(c => c.id === id)?.nome || '—'

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pets</h1>
          <p className="page-subtitle">{pets.length} pet(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ Novo Pet</button>
      </div>

      <div className="card">
        {pets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐾</div>
            <p>Nenhum pet cadastrado ainda.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openModal}>Cadastrar primeiro pet</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Espécie</th>
                  <th>Raça</th>
                  <th>Peso</th>
                  <th>Tutor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pets.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.nome}</strong></td>
                    <td>{especieIcon(p.especie)} {p.especie}</td>
                    <td>{p.raca || '—'}</td>
                    <td>{p.peso ? `${p.peso} kg` : '—'}</td>
                    <td>{clienteNome(p.cliente_id)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(p.id)}>🗑️</button>
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
            <h2 className="modal-title">🐾 Novo Pet</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Rex" />
              </div>
              <div className="form-group">
                <label className="form-label">Espécie *</label>
                <select className="form-input" value={form.especie} onChange={e => setForm({ ...form, especie: e.target.value })}>
                  {ESPECIES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Raça</label>
                <input className="form-input" value={form.raca} onChange={e => setForm({ ...form, raca: e.target.value })} placeholder="Ex: Labrador" />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input className="form-input" type="number" step="0.1" value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })} placeholder="Ex: 12.5" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tutor</label>
              <select className="form-input" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar Pet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function especieIcon(e) {
  const icons = { 'Cão': '🐕', 'Gato': '🐈', 'Ave': '🦜', 'Réptil': '🦎', 'Roedor': '🐭', 'Outro': '🐾' }
  return icons[e] || '🐾'
}
