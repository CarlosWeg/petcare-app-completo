import { useEffect, useState } from 'react'
import { clientesAPI } from '../api'
import { toast } from '../components/Toast'

const EMPTY = { nome: '', email: '', telefone: '', endereco: '', cpf: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)   // null | 'novo' | 'editar'
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')

  const load = () => clientesAPI.listar()
    .then(setClientes).catch(() => toast('Erro ao carregar clientes','error'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const abrir = (cliente = null) => {
    setForm(cliente ? { ...cliente } : EMPTY)
    setModal(cliente ? 'editar' : 'novo')
  }
  const fechar = () => { setModal(null); setForm(EMPTY) }

  const salvar = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'novo') await clientesAPI.criar(form)
      else await clientesAPI.atualizar(form._id, form)
      toast(modal === 'novo' ? 'Cliente criado!' : 'Cliente atualizado!')
      fechar(); load()
    } catch(err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const remover = async id => {
    if (!confirm('Remover este cliente?')) return
    try { await clientesAPI.remover(id); toast('Cliente removido!'); load() }
    catch(err) { toast(err.message,'error') }
  }

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) return <div className="loading"><div className="spinner"/><p>Carregando…</p></div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p>Total: {clientes.length} clientes cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrir()}>
          <span>＋</span> Novo Cliente
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Buscar por nome ou email…" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Nome</th><th>Email</th><th>Telefone</th><th>CPF</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {filtrados.length === 0
              ? <tr><td colSpan={5}><div className="empty-state"><p>Nenhum cliente encontrado</p></div></td></tr>
              : filtrados.map(c => (
                <tr key={c._id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:10}}><div className="avatar">{c.nome?.[0]?.toUpperCase()}</div>{c.nome}</div></td>
                  <td>{c.email}</td>
                  <td>{c.telefone}</td>
                  <td style={{fontFamily:'monospace'}}>{c.cpf}</td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrir(c)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remover(c._id)}>Remover</button>
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
              <h2>{modal === 'novo' ? 'Novo Cliente' : 'Editar Cliente'}</h2>
              <button className="modal-close" onClick={fechar}>✕</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome completo *</label>
                  <input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="João da Silva" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="joao@email.com" />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(47) 99999-9999" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>CPF</label>
                    <input value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} placeholder="000.000.000-00" />
                  </div>
                  <div className="form-group">
                    <label>Endereço</label>
                    <input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} placeholder="Rua das Flores, 123" />
                  </div>
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
