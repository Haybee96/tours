const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require("../utils/catchAsync");
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        // PAYMENT METHOD TYPE -> the info about the session itself.
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,

        // TOUR DETAILS
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1,
            }
        ]

    });

    // 3) Send session as response to client
    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    // This is TEMPORARY because it's UNSECURE: everyone can make bookings without paying.
    const { tour, user, price } = req.query;

    // If no tour and no user and no price go to the next middleware stack
    if (!tour && !user && !price) return next();

    // Create a new booking
    await Booking.create({ tour, user, price });
    
    // Redirect to the url
    res.redirect(req.originalUrl.split('?')[0]);
});

// CRUD
exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

