const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Any middleware after this route would be PROTECTED
router.use(authController.protect);

// Checkout route
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// Any middleware after this route would be RESTRICTED to only admin and lead-guide
router.use(authController.restrictTo('admin', 'lead-guide'));

router.route('/').post(bookingController.createBooking).get(bookingController.getAllBookings);
router.route('/:id').get(bookingController.getBooking).patch(bookingController.updateBooking).delete(bookingController.deleteBooking);

module.exports = router;
