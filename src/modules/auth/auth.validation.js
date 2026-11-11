const { z } = require('zod');

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

exports.registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role_id: z.number().optional()
});

exports.refreshSchema = z.object({
  refreshToken: z.string().optional(),
  refresh_token: z.string().optional()
});

exports.updateProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  name: z.string().optional(), // For legacy user model support
  phone: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  avatar: z.string().optional(),
  thumb_url: z.string().optional(),
  profile_image: z.string().optional() // Alias for thumb_url
});
