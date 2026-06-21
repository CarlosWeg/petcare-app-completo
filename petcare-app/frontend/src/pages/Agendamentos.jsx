import { useEffect, useState } from 'react'
import { agendamentosAPI, petsAPI } from '../api'
import { toast } from '../components/Toast'

const EMPTY = { petId: '', servico: '', data: '', hora: '', observacoes: '', status: 'agendado' }
const SERVICOS = ['Banho','Tosa','Banho e Tosa','Consulta Veterinária','Vacinação','Castração','Exame de Sangue','Chip de Identificação','Hospedagem','Adestramento']
const STATUS = { agendado:'badge-blue', confirmado:'badge-green', concluido:'badge-gray', cancelado:'badge-red' }
const STATUS_LABEL = { agendado:'Agendado', confirmado:'Confirmado', concluido:'Concluído', cancelado:'Cancelado' }

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [snsInfo, setSnsInfo] = useState(null)

  const load = () => Promise.all([agendamentosAPI.listar(), petsAPI.listar()])
    .then(([a, p]) => { setAgendamentos(a); setPets(p) })
    .catch(() => toast('Erro ao carregar dados','error'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const abrir = (ag = null) => {
    if (ag) {
      const dt = ag.data ? new Date(ag.data) : null
      setForm({ ...ag, petId: ag.pet?._id || ag.pet,
        data: dt ? dt.toISOString().split('T')[0] : '',
        hora: dt ? dt.toTimeString().slice(0,5) : '' })
    } else setForm(EMPTY)
    setModal(ag ? 'editar' : 'novo')
    setSnsInfo(null)
  }
  const fechar = () => { setModal(null); setForm(EMPTY); setSnsInfo(null) }

  const salvar = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, data: form.data && form.hora ? `${form.data}T${form.hora}:00` : form.data }
      let res
      if (modal === 'novo') res = await agendamentosAPI.criar(payload)
      else { res = await agendamentosAPI.atualizar(form._id, payload) }
      
      if (modal === 'novo' && res?.sns) setSnsInfo(res.sns)
      toast(modal === 'novo' ? '✅ Agendamento criado e enviado para fila SQS!' : 'Agendamento atualizado!')
      load()
      if (modal !== 'novo') fechar()
      else setModal('sucesso')
    } catch(err) { toast(err.message,'error') }
    finally { setSaving(false) }
  }

  const mudarStatus = async (id, status) => {
    try { await agendamentosAPI.atualizar(id, { status }); toast('Status atualizado!'); load() }
    catch(err) { toast(err.message,'error') }
  }

  const remover = async id => {
    if (!confirm('Remover este agendamento?')) return
    try { await agendamentosAPI.remover(id); toast('Removido!'); load() }
    catch(err) { toast(err.message,'error') }
  }

  const filtrados = agendamentos.filter(a => filtroStatus === 'todos' || a.status === filtroStatus)
  const today = new Date().toDateString()

  if (loading) return <div className="loading"><div className="spinner"/><p>Carregando…</p></div>

  return (
    <>
      <div className="page-header">
        <div><h2>Agendamentos</h2><p>Total: {agendamentos.length} registros</p></div>
        <button className="btn btn-primary" onClick={() => abrir()}>＋ Novo Agendamento</button>
      </div>

      {/* Filter bar */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {['todos','agendado','confirmado','concluido','cancelado'].map(s => (
          <button key={s} className={`btn btn-sm ${filtroStatus===s?'btn-primary':'btn-secondary'}`}
            onClick={() => setFiltroStatus(s)} style={{textTransform:'capitalize'}}>
            {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Data/Hora</th><th>Pet</th><th>Tutor</th><th>Serviço</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {filtrados.length === 0
              ? <tr><td colSpan={6}><div className="empty-state"><p>Nenhum agendamento</p></div></td></tr>
              : filtrados.map(a => {
                const dt = a.data ? new Date(a.data) : null
                const isToday = dt?.toDateString() === today
                return (
                  <tr key={a._id}>
                    <td>
                      <div>
                        {dt ? dt.toLocaleDateString('pt-BR') : '—'}
                        {isToday && <span className="badge badge-yellow" style={{marginLeft:6,fontSize:10}}>Hoje</span>}
                      </div>
                      <div style={{fontSize:12,color:'var(--gray-400)'}}>{dt ? dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''}</div>
                    </td>
                    <td>{a.pet?.nome || '—'}</td>
                    <td>{a.pet?.cliente?.nome || '—'}</td>
                    <td><span className="badge badge-blue">{a.servico}</span></td>
                    <td>
                      <select className="badge" style={{border:'none',cursor:'pointer',background:'none',fontSize:12}}
                        value={a.status} onChange={e => mudarStatus(a._id, e.target.value)}>
                        {Object.keys(STATUS).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrir(a)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remover(a._id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {(modal === 'novo' || modal === 'editar') && (
        <div className="modal-overlay" onClick={fechar}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'novo' ? '📅 Novo Agendamento' : '✏️ Editar Agendamento'}</h2>
              <button className="modal-close" onClick={fechar}>✕</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Pet *</label>
                  <select required value={form.petId} onChange={e => setForm({...form,petId:e.target.value})}>
                    <option value="">Selecione o pet…</option>
                    {pets.map(p => <option key={p._id} value={p._id}>{p.nome} ({p.cliente?.nome || 'sem tutor'})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Serviço *</label>
                  <select required value={form.servico} onChange={e => setForm({...form,servico:e.target.value})}>
                    <option value="">Selecione o serviço…</option>
                    {SERVICOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Data *</label>
                    <input required type="date" value={form.data} onChange={e => setForm({...form,data:e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Hora *</label>
                    <input required type="time" value={form.hora} onChange={e => setForm({...form,hora:e.target.value})} />
                  </div>
                </div>
                {modal === 'editar' && (
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                      {Object.keys(STATUS).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm({...form,observacoes:e.target.value})} placeholder="Notas adicionais…" />
                </div>
                {modal === 'novo' && (
                  <div style={{background:'var(--green-50)',border:'1px solid var(--green-200)',borderRadius:'var(--radius)',padding:12,fontSize:13,color:'var(--green-700)'}}>
                    📢 Ao criar, o agendamento será publicado no <strong>SNS Topic</strong> → <strong>SQS Queue</strong> → <strong>Worker K8s</strong> → <strong>Lambda</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={fechar}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enviando…' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success modal with SNS info */}
      {modal === 'sucesso' && (
        <div className="modal-overlay" onClick={fechar}>
          <div className="modal" style={{maxWidth:460}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Agendamento Criado!</h2>
              <button className="modal-close" onClick={fechar}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{marginBottom:16,color:'var(--gray-600)'}}>Agendamento salvo no MongoDB e evento publicado no fluxo de mensageria.</p>
              {snsInfo && (
                <div style={{background:'var(--gray-50)',borderRadius:'var(--radius)',padding:16,fontFamily:'monospace',fontSize:12}}>
                  <div style={{marginBottom:8,fontWeight:600,fontFamily:'inherit'}}>📨 Resposta do SNS:</div>
                  <div><span style={{color:'var(--gray-500)'}}>MessageId:</span> {snsInfo.MessageId}</div>
                  <div style={{marginTop:4}}><span style={{color:'var(--gray-500)'}}>Status:</span> <span style={{color:'var(--green-600)'}}>Publicado com sucesso</span></div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={fechar}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
