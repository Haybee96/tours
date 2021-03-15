const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes 
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.createReview = factory.createOne(Review); // Create new review
exports.getAllReviews = factory.getAll(Review); // Get all reviews
exports.getReview = factory.getOne(Review); // Get single review
exports.updateReview = factory.updateOne(Review); // Update review
exports.deleteReview = factory.deleteOne(Review); // Delete review