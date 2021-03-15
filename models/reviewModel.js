const mongoose = require('mongoose');
const Tour = require('./tourModel');

// Review schema
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty'],
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to a tour'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must belong to a user'],
    }
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
}
);

// Prevent duplicate reviews using indexes
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Populate fields with actual data
reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

// Static method for calculating average rating on tour
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 }, // Calculate number of ratings for each review for the current tour
                avgRating: { $avg: '$rating' }, // Average rating = (sum of ratings / no of ratings) for each review doc
            }
        }
    ]);

    // console.log(stats);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

// Calculate the average ratings after document has been saved in the DB on creating new review
reviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
    // Get accessed to the document before saving to db
    this.r = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

// Create a new review model
const Review = mongoose.model('Review', reviewSchema);

// Exports the review model
module.exports = Review;