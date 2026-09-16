'use strict';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

jest.mock('../models/User');

const User = require('../models/User');
const { googleLogin } = require('../controllers/authController');

describe('Google Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne = jest.fn();
    User.create = jest.fn();

    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should return 400 if no idToken is provided', async () => {
    req.body = {};
    await googleLogin(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/No Google ID token provided/i);
  });

  it('should return 401 if Google token verification fails', async () => {
    req.body = { idToken: 'invalid_token' };
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    await googleLogin(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toMatch(/Invalid Google token/i);
  });

  it('should create new user and return token when Google verification succeeds for new user', async () => {
    req.body = { idToken: 'valid_mock_token' };

    const mockPayload = {
      sub: 'google-uid-12345',
      email: 'testuser@gmail.com',
      name: 'Test Google User',
      picture: 'https://example.com/photo.jpg',
    };

    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => mockPayload,
    });

    User.findOne.mockResolvedValue(null);

    const mockUserInstance = {
      _id: 'user_id_123',
      name: 'Test Google User',
      email: 'testuser@gmail.com',
      role: 'citizen',
      isActive: true,
      getSignedJwtToken: jest.fn().mockReturnValue('mock_access_token'),
      getRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
      toPublic: jest.fn().mockReturnValue({
        id: 'user_id_123',
        name: 'Test Google User',
        email: 'testuser@gmail.com',
        role: 'citizen',
      }),
    };

    User.create.mockResolvedValueOnce(mockUserInstance);

    await googleLogin(req, res, next);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'testuser@gmail.com',
        googleId: 'google-uid-12345',
        authProvider: 'google',
        role: 'citizen',
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
          user: expect.objectContaining({
            email: 'testuser@gmail.com',
          }),
        }),
      })
    );
  });

  it('should link existing user by email when Google user logs in for the first time', async () => {
    req.body = { idToken: 'valid_mock_token' };

    const mockPayload = {
      sub: 'google-uid-999',
      email: 'existing@example.com',
      name: 'Existing User',
      picture: 'https://example.com/avatar.jpg',
    };

    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => mockPayload,
    });

    const mockExistingUser = {
      _id: 'existing_user_id',
      name: 'Existing User',
      email: 'existing@example.com',
      role: 'citizen',
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
      getSignedJwtToken: jest.fn().mockReturnValue('mock_access_token'),
      getRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
      toPublic: jest.fn().mockReturnValue({
        id: 'existing_user_id',
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'citizen',
      }),
    };

    User.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockExistingUser);

    await googleLogin(req, res, next);

    expect(mockExistingUser.googleId).toBe('google-uid-999');
    expect(mockExistingUser.authProvider).toBe('google');
    expect(mockExistingUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should login returning user who already has googleId linked', async () => {
    req.body = { idToken: 'valid_mock_token' };

    const mockPayload = {
      sub: 'google-uid-returning',
      email: 'returning@example.com',
      name: 'Returning User',
      picture: 'https://example.com/newavatar.jpg',
    };

    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => mockPayload,
    });

    const mockReturningUser = {
      _id: 'returning_user_id',
      name: 'Returning User',
      email: 'returning@example.com',
      googleId: 'google-uid-returning',
      profilePic: 'https://example.com/oldavatar.jpg',
      role: 'citizen',
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
      getSignedJwtToken: jest.fn().mockReturnValue('mock_access_token'),
      getRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
      toPublic: jest.fn().mockReturnValue({
        id: 'returning_user_id',
        name: 'Returning User',
        email: 'returning@example.com',
        role: 'citizen',
      }),
    };

    User.findOne.mockResolvedValueOnce(mockReturningUser);

    await googleLogin(req, res, next);

    expect(mockReturningUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(mockReturningUser.profilePic).toBe('https://example.com/newavatar.jpg');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
