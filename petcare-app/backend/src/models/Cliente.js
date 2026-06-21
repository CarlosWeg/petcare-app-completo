const { Schema, model } = require('mongoose')

const clienteSchema = new Schema({
  nome:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  telefone: { type: String, trim: true },
  cpf:      { type: String, trim: true },
  endereco: { type: String, trim: true },
}, { timestamps: true })

clienteSchema.index({ nome: 'text', email: 'text' })

module.exports = model('Cliente', clienteSchema)
