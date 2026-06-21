const router = require('express').Router()
const multer = require('multer')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')
const Pet = require('../models/Pet')

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
const BUCKET = process.env.S3_BUCKET || 'petcare-cloud-pet-images'
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// GET /api/pets
router.get('/', async (req, res, next) => {
  try {
    const pets = await Pet.find().populate('cliente', 'nome email').sort({ nome: 1 })
    res.json(pets)
  } catch (err) { next(err) }
})

// GET /api/pets/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('cliente', 'nome email telefone')
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' })
    res.json(pet)
  } catch (err) { next(err) }
})

// POST /api/pets
router.post('/', async (req, res, next) => {
  try {
    const { clienteId, ...rest } = req.body
    const pet = await Pet.create({ ...rest, cliente: clienteId })
    const populated = await pet.populate('cliente', 'nome email')
    res.status(201).json(populated)
  } catch (err) { next(err) }
})

// PUT /api/pets/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { clienteId, ...rest } = req.body
    const update = clienteId ? { ...rest, cliente: clienteId } : rest
    const pet = await Pet.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('cliente', 'nome email')
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' })
    res.json(pet)
  } catch (err) { next(err) }
})

// DELETE /api/pets/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id)
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' })
    res.json({ message: 'Pet removido com sucesso' })
  } catch (err) { next(err) }
})

// POST /api/pets/:id/imagem — upload para S3
router.post('/:id/imagem', upload.single('imagem'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' })

    const key = `pets/${req.params.id}/${uuidv4()}-${req.file.originalname}`
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }))

    const imagemUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`
    const pet = await Pet.findByIdAndUpdate(req.params.id, { imagemUrl, imagemS3Key: key }, { new: true })
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' })

    res.json({ imagemUrl, pet })
  } catch (err) { next(err) }
})

module.exports = router
