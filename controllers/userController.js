const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');


// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-5r5w3d5ref6d-88888.jpg
//     // Extract the file name from the uploaded file
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// Multer Storage
const multerStorage = multer.memoryStorage();

// Multer filter - test if the uploaded file is an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only images', 400), false);
  }
};

// Create upload
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Filter object for updating specific fields in a document
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware to allow uploads
exports.uploadUserPhoto = upload.single('photo');

// Resize user Photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  
  // If no file GOTO next middleware in the stack
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // If there is file to upload, resize it.
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// Get currently logged in user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

// User (currently logged in) update account
exports.updateMe = catchAsync(async (req, res, next) => {
  
  // create error if the user try to update the password with this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /update-my-password',
        400
      )
    );
  }

  // filter out fields that should be updated: TEST THIS FIRST
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

  // Send response back to the client
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    }
  });
});

// User (currently logged in) delete account -> set account to false
exports.deleteMe = catchAsync(async(req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = catchAsync(async (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use the /signup route instead.',
  });
});

exports.getAllUsers = factory.getAll(User); // Find all users -> by Admin
exports.getUser = factory.getOne(User); // Admin get single user
exports.updateUser = factory.updateOne(User); // Admin update existing user -> do NOT update user's password with this
exports.deleteUser = factory.deleteOne(User); // Admin delete user