import { useEffect, useState } from 'react'
import { petsAPI, clientesAPI } from '../api'
import { toast } from '../components/Toast'

const EMPTY = { nome: '', tipo: 'cachorro', raca: '', idade: '', peso: '', clienteId: '', observacoes: '' }
const TIPOS = ['cachorro','gato','ave','roedor','reptil','outro']
const TIPO_ICON = { cachorro:'🐶', gato:'🐱', ave:'🦜', roedor:'🐹', reptil:'🦎', outro:'🐾' }

export default function Pets() {
  const [pets, setPets] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')

  const load = () => Promise.all([petsAPI.listar(), clientesAPI.listar()])
    .then(([p, c]) => { setPets(p); setClientes(c) })
    .catch(() => toast('Erro ao carregar dados','error'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const abrir = (pet = null) => {
    setForm(pet ? { ...pet, clienteId: pet.cliente?._id || pet.cliente } : EMPTY)
    setModal(pet ? 'editar' : 'novo')
  }
  const fechar = () => { setModal(null); setForm(EMPTY) }

  const salvar = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal === 'novo') await petsAPI.criar(form)
      else await petsAPI.atualizar(form._id, form)
      toast(modal === 'novo' ? 'Pet cadastrado!' : 'Pet atualizado!')
      fechar(); load()
    } catch(err) { toast(err.message,'error') }
    finally { setSaving(false) }
  }

  const remover = async id => {
    if (!confirm('Remover este pet?')) return
    try { await petsAPI.remover(id); toast('Pet removido!'); load() }
    catch(err) { toast(err.message,'error') }
  }

  const filtrados = pets.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.raca?.toLowerCase().includes(busca.toLowerCase()) ||
    p.cliente?.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) return <div className="loading"><div className="spinner"/><p>Carregando…</p></div>

  return (
    <>
      <div className="page-header">
        <div><h2>Pets</h2><p>Total: {pets.length} animais cadastrados</p></div>
        <button className="btn btn-primary" onClick={() => abrir()}>＋ Novo Pet</button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Buscar por nome, raça ou tutor…" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Pet</th><th>Tipo / Raça</th><th>Idade</th><th>Peso</th><th>Tutor</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {filtrados.length === 0
              ? <tr><td colSpan={6}><div className="empty-state"><p>Nenhum pet encontrado</p></div></td></tr>
              : filtrados.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="pet-name">
                      <span className="pet-icon">{TIPO_ICON[p.tipo] || '🐾'}</span>
                      <strong>{p.nome}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-green" style={{marginRight:6,textTransform:'capitalize'}}>{p.tipo}</span>
                    <span style={{color:'var(--gray-500)'}}>{p.raca || '—'}</span>
                  </td>
                  <td>{p.idade ? `${p.idade} anos` : '—'}</td>
                  <td>{p.peso ? `${p.peso} kg` : '—'}</td>
                  <td>{p.cliente?.nome || '—'}</td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrir(p)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remover(p._id)}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={fechar}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'novo' ? 'Cadastrar Pet' : 'Editar Pet'}</h2>
              <button className="modal-close" onClick={fechar}>✕</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome do pet *</label>
                    <input required value={form.nome} onChange={e => setForm({...form,nome:e.target.value})} placeholder="Rex" />
                  </div>
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select value={form.tipo} onChange={e => setForm({...form,tipo:e.target.value})}>
                      {TIPOS.map(t => <option key={t} value={t} style={{textTransform:'capitalize'}}>{TIPO_ICON[t]} {t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Raça</label>
                    <input value={form.raca} onChange={e => setForm({...form,raca:e.target.value})} placeholder="Labrador" />
                  </div>
                  <div className="form-group">
                    <label>Tutor *</label>
                    <select required value={form.clienteId} onChange={e => setForm({...form,clienteId:e.target.value})}>
                      <option value="">Selecione o tutor…</option>
                      {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Idade (anos)</label>
                    <input type="number" min="0" max="30" value={form.idade} onChange={e => setForm({...form,idade:e.target.value})} placeholder="3" />
                  </div>
                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input type="number" min="0" step="0.1" value={form.peso} onChange={e => setForm({...form,peso:e.target.value})} placeholder="5.5" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm({...form,observacoes:e.target.value})} placeholder="Alergias, comportamento, vacinas…" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={fechar}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
