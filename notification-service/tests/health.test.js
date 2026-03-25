const request = require('supertest')
const app = require('../src/app')

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
