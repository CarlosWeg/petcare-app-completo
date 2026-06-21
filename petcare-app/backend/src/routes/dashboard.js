const router = require('express').Router()
const Cliente = require('../models/Cliente')
const Pet = require('../models/Pet')
const Agendamento = require('../models/Agendamento')

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfDay = new Date(startOfDay.getTime() + 86400000)

    const [clientes, pets, agendamentosHoje, agendamentosMes] = await Promise.all([
      Cliente.countDocuments(),
      Pet.countDocuments(),
      Agendamento.countDocuments({ data: { $gte: startOfDay, $lt: endOfDay } }),
      Agendamento.countDocuments({ data: { $gte: startOfMonth } }),
    ])

    res.json({ clientes, pets, agendamentosHoje, agendamentosMes })
  } catch (err) { next(err) }
})

// GET /api/dashboard/recent
router.get('/recent', async (req, res, next) => {
  try {
    const recent = await Agendamento.find()
      .populate({ path: 'pet', select: 'nome tipo raca', populate: { path: 'cliente', select: 'nome' } })
      .sort({ createdAt: -1 })
      .limit(10)
    res.json(recent)
  } catch (err) { next(err) }
})

module.exports = router
