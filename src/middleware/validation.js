const { body, validationResult } = require('express-validator');

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateRegister = [
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
];

exports.validateSermon = [
  body('title').notEmpty().withMessage('Title is required'),
  body('speaker').notEmpty().withMessage('Speaker is required'),
  body('date').isISO8601().withMessage('Valid date required'),
];

exports.validateAnnouncement = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
];

exports.validatePrayerRequest = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
];

exports.validateBaptism = [
  body('personName').notEmpty().withMessage('Person name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('baptismDate').isISO8601().withMessage('Valid baptism date required'),
  body('parents.father').notEmpty().withMessage('Father name is required'),
  body('parents.mother').notEmpty().withMessage('Mother name is required'),
  body('priest').notEmpty().withMessage('Priest name is required'),
  body('location').notEmpty().withMessage('Location is required'),
];

exports.validateMarriage = [
  body('brideName').notEmpty().withMessage('Bride name is required'),
  body('groomName').notEmpty().withMessage('Groom name is required'),
  body('brideDateOfBirth').isISO8601().withMessage('Valid bride date of birth required'),
  body('groomDateOfBirth').isISO8601().withMessage('Valid groom date of birth required'),
  body('weddingDate').isISO8601().withMessage('Valid wedding date required'),
  body('witnesses.witness1').notEmpty().withMessage('First witness is required'),
  body('witnesses.witness2').notEmpty().withMessage('Second witness is required'),
  body('priest').notEmpty().withMessage('Priest name is required'),
  body('location').notEmpty().withMessage('Location is required'),
];

exports.validateSacrament = [
  body('personName').notEmpty().withMessage('Person name is required'),
  body('sacramentType').isIn(['Confirmation', 'Eucharist', 'Reconciliation', 'Anointing of the Sick', 'Holy Orders']).withMessage('Valid sacrament type required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('sacramentDate').isISO8601().withMessage('Valid sacrament date required'),
  body('priest').notEmpty().withMessage('Priest name is required'),
  body('location').notEmpty().withMessage('Location is required'),
];