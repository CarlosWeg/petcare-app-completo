const router = require('express').Router()
const Cliente = require('../models/Cliente')

// GET /api/clientes
router.get('/', async (req, res, next) => {
  try {
    const redis = req.app.locals.redis
    const CACHE_KEY = 'clientes:all'

    if (redis) {
      const cached = await redis.get(CACHE_KEY).catch(() => null)
      if (cached) return res.json(JSON.parse(cached))
    }

    const clientes = await Cliente.find().sort({ nome: 1 })

    if (redis) redis.setEx(CACHE_KEY, 60, JSON.stringify(clientes)).catch(() => {})

    res.json(clientes)
  } catch (err) { next(err) }
})

// GET /api/clientes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' })
    res.json(cliente)
  } catch (err) { next(err) }
})

// POST /api/clientes
router.post('/', async (req, res, next) => {
  try {
    const cliente = await Cliente.create(req.body)
    // Invalida cache
    const redis = req.app.locals.redis
    if (redis) redis.del('clientes:all').catch(() => {})
    res.status(201).json(cliente)
  } catch (err) { next(err) }
})

// PUT /api/clientes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' })
    const redis = req.app.locals.redis
    if (redis) redis.del('clientes:all').catch(() => {})
    res.json(cliente)
  } catch (err) { next(err) }
})

// DELETE /api/clientes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id)
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' })
    const redis = req.app.locals.redis
    if (redis) redis.del('clientes:all').catch(() => {})
    res.json({ message: 'Cliente removido com sucesso' })
  } catch (err) { next(err) }
})

module.exports = router
