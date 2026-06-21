const router = require('express').Router()
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns')
const Agendamento = require('../models/Agendamento')

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' })
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN

// GET /api/agendamentos
router.get('/', async (req, res, next) => {
  try {
    const agendamentos = await Agendamento.find()
      .populate({ path: 'pet', select: 'nome tipo raca', populate: { path: 'cliente', select: 'nome email telefone' } })
      .sort({ data: -1 })
    res.json(agendamentos)
  } catch (err) { next(err) }
})

// GET /api/agendamentos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const ag = await Agendamento.findById(req.params.id)
      .populate({ path: 'pet', populate: { path: 'cliente' } })
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' })
    res.json(ag)
  } catch (err) { next(err) }
})

// POST /api/agendamentos — salva no MongoDB e publica no SNS → SQS → Worker → Lambda
router.post('/', async (req, res, next) => {
  try {
    const { petId, ...rest } = req.body
    const agendamento = await Agendamento.create({ ...rest, pet: petId })

    // Popular para retornar dados completos
    const populated = await agendamento.populate({
      path: 'pet',
      select: 'nome tipo raca',
      populate: { path: 'cliente', select: 'nome email telefone' }
    })

    // Publicar no SNS (dispara o fluxo SNS → SQS → Worker → Lambda)
    let snsResult = null
    if (SNS_TOPIC_ARN) {
      try {
        const mensagem = {
          evento: 'NOVO_AGENDAMENTO',
          agendamentoId: agendamento._id.toString(),
          pet: {
            id: populated.pet?._id,
            nome: populated.pet?.nome,
            tipo: populated.pet?.tipo,
          },
          cliente: {
            nome: populated.pet?.cliente?.nome,
            email: populated.pet?.cliente?.email,
            telefone: populated.pet?.cliente?.telefone,
          },
          servico: agendamento.servico,
          data: agendamento.data,
          status: agendamento.status,
          criadoEm: agendamento.createdAt,
        }

        const cmd = new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify(mensagem),
          Subject: `PetCare: Novo agendamento — ${agendamento.servico}`,
          MessageAttributes: {
            evento: { DataType: 'String', StringValue: 'NOVO_AGENDAMENTO' }
          }
        })
        snsResult = await sns.send(cmd)
        console.log('✅ SNS publicado:', snsResult.MessageId)

        // Salvar MessageId no agendamento
        await Agendamento.findByIdAndUpdate(agendamento._id, { snsMessageId: snsResult.MessageId })
      } catch (snsErr) {
        console.error('⚠️  Erro ao publicar SNS:', snsErr.message)
      }
    } else {
      console.warn('⚠️  SNS_TOPIC_ARN não configurado — mensageria desabilitada')
    }

    res.status(201).json({ ...populated.toObject(), sns: snsResult })
  } catch (err) { next(err) }
})

// PUT /api/agendamentos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { petId, ...rest } = req.body
    const update = petId ? { ...rest, pet: petId } : rest
    const ag = await Agendamento.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate({ path: 'pet', select: 'nome tipo', populate: { path: 'cliente', select: 'nome email' } })
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' })
    res.json(ag)
  } catch (err) { next(err) }
})

// DELETE /api/agendamentos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const ag = await Agendamento.findByIdAndDelete(req.params.id)
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' })
    res.json({ message: 'Agendamento removido com sucesso' })
  } catch (err) { next(err) }
})

module.exports = router
