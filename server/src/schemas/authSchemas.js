const { z } = require('zod');

const ROLES = ['EMT', 'SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(ROLES, { required_error: 'Role is required' }),
  station: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60).optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(ROLES, { required_error: 'Role is required' }).optional(),
  station: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

module.exports = { registerSchema, loginSchema, refreshSchema, updateUserSchema };
