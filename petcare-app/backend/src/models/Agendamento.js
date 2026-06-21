const { Schema, model } = require('mongoose')

const agendamentoSchema = new Schema({
  pet:          { type: Schema.Types.ObjectId, ref: 'Pet', required: true },
  servico:      { type: String, required: true },
  data:         { type: Date, required: true },
  status:       { type: String, enum: ['agendado','confirmado','concluido','cancelado'], default: 'agendado' },
  observacoes:  { type: String },
  snsMessageId: { type: String },   // ID da mensagem publicada no SNS
}, { timestamps: true })

agendamentoSchema.index({ data: 1, status: 1 })

module.exports = model('Agendamento', agendamentoSchema)
