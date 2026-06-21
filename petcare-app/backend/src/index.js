require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { createClient } = require('redis')

const app = express()
const PORT = process.env.PORT || 4000

// ── Middleware ──────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(morgan('combined'))

// ── MongoDB ─────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/petcare'
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado:', MONGO_URI))
  .catch(err => console.error('❌ Erro MongoDB:', err.message))

// ── Redis ────────────────────────────────────────────────────────────────
let redis = null
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379'

;(async () => {
  try {
    redis = createClient({ url: REDIS_URL })
    redis.on('error', err => console.warn('Redis error:', err.message))
    await redis.connect()
    console.log('✅ Redis conectado:', REDIS_URL)
    // Expose redis globally for routes
    app.locals.redis = redis
  } catch (err) {
    console.warn('⚠️  Redis indisponível — cache desabilitado:', err.message)
  }
})()

// ── Routes ───────────────────────────────────────────────────────────────
app.use('/api/clientes',     require('./routes/clientes'))
app.use('/api/pets',         require('./routes/pets'))
app.use('/api/agendamentos', require('./routes/agendamentos'))
app.use('/api/dashboard',    require('./routes/dashboard'))

// ── Health check ─────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState
  const mongoStatus = ['disconnected','connected','connecting','disconnecting'][mongoState]

  let redisStatus = 'disconnected'
  try {
    if (redis) { await redis.ping(); redisStatus = 'connected' }
  } catch {}

  res.json({
    status: 'ok',
    service: 'petcare-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus,
      aws_region: process.env.AWS_REGION || 'us-east-1'
    }
  })
})

// ── 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }))

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Erro interno' })
})

app.listen(PORT, () => console.log(`🚀 PetCare Backend rodando na porta ${PORT}`))
