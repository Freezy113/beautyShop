import { body, param, query } from 'express-validator';

export const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

export const validateService = [
  body('name').notEmpty().trim(),
  body('price').isInt({ min: 0 }),
  body('durationMin').isInt({ min: 15 }),
  body('isPublic').optional().isBoolean()
];

export const validateAppointment = [
  body('serviceId').optional().isUUID(),
  body('clientName').notEmpty().trim(),
  body('clientPhone').isMobilePhone('ru-RU'),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('finalPrice').optional().isInt({ min: 0 }),
  body('notes').optional().isString()
];

export const validateClient = [
  body('name').notEmpty().trim(),
  body('phone').isMobilePhone('ru-RU'),
  body('notes').optional().isString()
];

export const validateExpense = [
  body('amount').isInt({ min: 1 }),
  body('description').notEmpty().trim()
];

export const validateId = [
  param('id').isUUID()
];