const authMiddleware = require('../src/middleware/authMiddleware');
const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('1. No token provided - 401', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  test('2. Valid token - calls next()', () => {
    const token = jwt.sign({ id: 'u1' }, 'test-secret');
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('u1');
  });

  test('3. Invalid token - 401', () => {
    req.headers.authorization = 'Bearer invalid-token';

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });
});