const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {

    // Get all tours from collection
    const tours = await Tour.find();

    // Build template
    // Render data based on tours results from collection
    res.status(200).render('overview', {
        title: 'All tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {

    // Get data from the collection
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'rating review user',
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    // Build template
    // Render data
    res.status(200).render('tour', {
      title: `${tour.name} tour`,
      tour,
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
});

exports.getSignupForm = catchAsync(async (req, res, next) => {
    res.status(200).render('signup', {
        title: 'Create a new account today',
    });
});

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTour = catchAsync(async (req, res, next) => {
    // Find all the bookings
    const bookings = await Booking.find({ user: req.user.id });

    // Find the tours with the IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in : tourIDs} });

    // Render template
    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email,
    }, {
        new: true,
        runValidators: true
    });

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser,
    });
});