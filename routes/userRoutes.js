const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// Start express router
const router = express.Router();

// No authentication needed
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protect all routes after this middleware (only allow authenticated users to perform operations)
router.use(authController.protect);

router.patch('/update-my-password', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/update-me',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

// Protect all routes after this middleware (only allow authenticated admin to perform operations)
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .post(userController.createUser)
  .get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;