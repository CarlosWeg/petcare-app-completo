const { Schema, model } = require('mongoose')

const petSchema = new Schema({
  nome:         { type: String, required: true, trim: true },
  tipo:         { type: String, enum: ['cachorro','gato','ave','roedor','reptil','outro'], default: 'cachorro' },
  raca:         { type: String, trim: true },
  idade:        { type: Number, min: 0 },
  peso:         { type: Number, min: 0 },
  cliente:      { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
  observacoes:  { type: String },
  imagemUrl:    { type: String },
  imagemS3Key:  { type: String },
}, { timestamps: true })

module.exports = model('Pet', petSchema)
