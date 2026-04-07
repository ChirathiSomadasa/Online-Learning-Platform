const request = require('supertest')
const app = require('../src/app')
const Notification = require('../src/models/Notification')
const nodemailer = require('nodemailer')
const axios = require('axios')

jest.mock('../src/models/Notification')
jest.mock('nodemailer')
jest.mock('axios')

describe('notification-service health', () => {
  it('returns service health', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'notificationservice',
    })
  })
})

describe('notification-service routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/notifications/send', () => {
    test('sends notification and logs status=sent', async () => {
      process.env.EMAIL_USER = 'test@example.com'
      process.env.EMAIL_PASS = 'pass'

      const sendMail = jest.fn().mockResolvedValue(true)
      nodemailer.createTransport.mockReturnValue({ sendMail })

      Notification.create.mockResolvedValue({ _id: '1' })
      Notification.findByIdAndUpdate.mockResolvedValue(true)

      const res = await request(app).post('/api/notifications/send').send({
        to: 'user@example.com',
        type: 'welcome',
        userName: 'Alice',
      })

      expect(res.statusCode).toBe(200)
      expect(res.body).toMatchObject({ message: 'Notification sent', id: '1' })
      expect(sendMail).toHaveBeenCalled()
      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith('1', {
        status: 'sent',
      })
    })

    test('returns 500 when sendMail fails and logs status=failed', async () => {
      process.env.EMAIL_USER = 'test@example.com'
      process.env.EMAIL_PASS = 'pass'

      const sendMail = jest.fn().mockRejectedValue(new Error('SMTP down'))
      nodemailer.createTransport.mockReturnValue({ sendMail })

      Notification.create.mockResolvedValue({ _id: '2' })
      Notification.findByIdAndUpdate.mockResolvedValue(true)

      const res = await request(app).post('/api/notifications/send').send({
        to: 'user@example.com',
        type: 'welcome',
        userName: 'Bob',
      })

      expect(res.statusCode).toBe(500)
      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith('2', {
        status: 'failed',
      })
    })
  })

  describe('GET /api/notifications/logs', () => {
    test('returns logs for authenticated user', async () => {
      axios.get.mockResolvedValue({
        data: { user: { email: 'admin@example.com', role: 'admin' } },
      })

      Notification.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: 'log1' }]),
      })

      const res = await request(app)
        .get('/api/notifications/logs')
        .set('Authorization', 'Bearer token')

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    test('returns 401 when auth fails', async () => {
      axios.get.mockRejectedValue(new Error('Invalid token'))

      const res = await request(app)
        .get('/api/notifications/logs')
        .set('Authorization', 'Bearer bad')

      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /api/notifications/logs/:email', () => {
    test('returns user logs for same email', async () => {
      axios.get.mockResolvedValue({
        data: { user: { email: 'user@example.com', role: 'student' } },
      })

      Notification.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ to: 'user@example.com' }]),
      })

      const res = await request(app)
        .get('/api/notifications/logs/user@example.com')
        .set('Authorization', 'Bearer token')

      expect(res.statusCode).toBe(200)
    })

    test('returns 403 for different user when not admin', async () => {
      axios.get.mockResolvedValue({
        data: { user: { email: 'user@example.com', role: 'student' } },
      })

      const res = await request(app)
        .get('/api/notifications/logs/other@example.com')
        .set('Authorization', 'Bearer token')

      expect(res.statusCode).toBe(403)
    })
  })
})
