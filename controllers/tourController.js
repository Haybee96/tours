const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

// Multer Storage
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Upload multiple images for mix of fields
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 }, // field can process 1 image.
  { name: 'images', maxCount: 3 } // field can process 3 images.
]);

// upload.single('image'); // 1 field to accept single image
// upload.array('images', 5); // 1 field which accept multiple images req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {

  // If no images or cover image were uploaded
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tours-${req.params.id}-${Date.now()}-cover.jpeg`;
  
  // If there is file to upload, resize it.
  // For imageCover resizing
  await sharp(req.files.imageCover[0].buffer).resize(2000, 1333).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/tours/${req.body.imageCover}`);

  // For images resizing
  req.body.images = [];

  await Promise.all(req.files.images.map(async (file, i) => {
    
    // Generate a unique filename for each image.
    const filename = `tours-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

    // Process the image
    await sharp(file.buffer).resize(2000, 1333).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/tours/${filename}`);

    req.body.images.push(filename);
  }));

  // Call the next middleware in the stack
  next();
});

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  // Call the next middleware in the stack
  next();
};

// Handler factory functions
exports.createTour = factory.createOne(Tour); // Create new tour
exports.getAllTours = factory.getAll(Tour); // Get all tours
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); // Get single tour
exports.updateTour = factory.updateOne(Tour); // Update tour
exports.deleteTour = factory.deleteOne(Tour); // Delete Tour

// Get tour statistics
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgRating: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// Get tour montly plan
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  console.log(year);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}/01/01`),
          $lte: new Date(`${year}/12/31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.060201,-118.284075/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {

  // Get parameters from route
  const { distance, latlng, unit } = req.params;

  // Get the latitude and longitude value
  const [ lat, lng ] = latlng.split(',');

  // Define the radius and convert to radians based on a specific unit (miles or kilometers)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
  }

  // Find tours within a certain geometry
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

  // Send response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    }
  });
});


// Get distances of the tour from the user location
exports.getDistances = catchAsync(async (req, res, next) => {

  // Get the parameters from the route
  const { latlng, unit } = req.params;

  // Get the latitude and longitude value
  const [ lat, lng ] = latlng.split(',');

  // Convert from meteres to miles or kilometers -> 1 meter = 0.000621371 miles
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      // Fields to be kept and ignore others
      $project: {
        distance: 1,
        name: 1,
      }
    }
  ]);

  // Send response
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    }
  });
});