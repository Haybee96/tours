const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

// Delete document controller
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  // Find document by ID and DELETE
  const doc = await Model.findByIdAndDelete(req.params.id);

  // Check if ID of a document exists
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Respond back to the client with the data
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Update document controller
exports.updateOne = Model => catchAsync(async (req, res, next) => {
  // Find tour by ID and UPDATE
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Check if ID of a tour exists
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Respond back to the client with the data
  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

// Create new document controller
exports.createOne = Model => catchAsync(async (req, res, next) => {
  
  // Create new document
  const doc = await Model.create(req.body);

  // Send response
  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

// Get single document controller
exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {

  // Find document by ID
  let query = Model.findById(req.params.id);

  // If there is populate options on the query
  if (populateOptions) query = query.populate(populateOptions);

  // Await the query
  const doc = await query;

  // Check if ID of a doc exists
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Respond to the client with the data
  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {

  // Allow nested GET route
  let filter = {};

  if (req.params.tourId) filter = { tour: req.params.tourId };

  // EXECUTE QUERY
  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const doc = await features.query.explain(); For index reading performance
  const doc = await features.query;

  // Send response
  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      data: doc,
    },
  });
});