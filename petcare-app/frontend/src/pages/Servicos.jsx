const SERVICOS = [
  { nome: 'Banho', icon: '🛁', desc: 'Higiene completa com shampoo e condicionador especiais.', preco: 'R$ 45,00', duracao: '1h' },
  { nome: 'Tosa', icon: '✂️', desc: 'Corte de pelos de acordo com o padrão da raça.', preco: 'R$ 55,00', duracao: '1h 30min' },
  { nome: 'Banho e Tosa', icon: '🐾', desc: 'Pacote completo: banho + tosa com desconto.', preco: 'R$ 85,00', duracao: '2h 30min' },
  { nome: 'Consulta Veterinária', icon: '🩺', desc: 'Avaliação clínica geral com médico veterinário.', preco: 'R$ 120,00', duracao: '30min' },
  { nome: 'Vacinação', icon: '💉', desc: 'Aplicação de vacinas obrigatórias e opcionais.', preco: 'R$ 80,00', duracao: '20min' },
  { nome: 'Castração', icon: '🏥', desc: 'Cirurgia de castração com acompanhamento pós-op.', preco: 'R$ 350,00', duracao: 'Dia inteiro' },
  { nome: 'Exame de Sangue', icon: '🔬', desc: 'Hemograma completo e bioquímica sérica.', preco: 'R$ 90,00', duracao: '15min' },
  { nome: 'Chip de Identificação', icon: '📡', desc: 'Implante de microchip com registro nacional.', preco: 'R$ 65,00', duracao: '15min' },
  { nome: 'Hospedagem', icon: '🏡', desc: 'Hotel para pets com monitoramento 24h.', preco: 'R$ 70,00/dia', duracao: 'Por diária' },
  { nome: 'Adestramento', icon: '🎓', desc: 'Sessões de adestramento comportamental.', preco: 'R$ 100,00', duracao: '1h' },
]

export default function Servicos() {
  return (
    <>
      <div className="page-header">
        <div><h2>Serviços</h2><p>Catálogo completo de serviços oferecidos</p></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
        {SERVICOS.map(s => (
          <div key={s.nome} className="card" style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:32}}>{s.icon}</span>
              <div>
                <div style={{fontWeight:600,fontSize:16}}>{s.nome}</div>
                <div style={{fontSize:12,color:'var(--gray-400)'}}>⏱ {s.duracao}</div>
              </div>
            </div>
            <p style={{fontSize:13,color:'var(--gray-600)',flex:1}}>{s.desc}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid var(--gray-100)'}}>
              <span style={{fontWeight:700,color:'var(--green-600)',fontSize:16}}>{s.preco}</span>
              <span className="badge badge-green">Disponível</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
