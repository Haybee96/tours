const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Save jwt via cookies
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// User sign up
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // Send email with link
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // response back to client
  createSendToken(newUser, 201, res);
});

// User log in
exports.login = catchAsync(async (req, res, next) => {

  // Get the value of email and password from the body
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if the user and password actually exist and correct respectively
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // response back to client
  createSendToken(user, 200, res);
});

// Log out user
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedoutUser', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// Protected user
exports.protect = catchAsync(async (req, res, next) => {
  // Getting the user token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if(req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to gain access', 401)
    );
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(new AppError('User of this token does not exist', 401));

  // Check if user has changed password after token issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again!', 401)
    );
  }

  // The next middleware is called - PROTECTED ROUTE ACCESS
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors recorded
exports.isLoggedIn = async (req, res, next) => {
  // If token exists
  if(req.cookies.jwt) {
    try {
        // Verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
    
      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
    
      // Check if user has changed password after token issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
    
      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    
    } catch (err) {
      return next();
    }
  }
  next();
};

// Restrict to only authorized users
exports.restrictTo = (...roles) => {
  // (...roles) returns the array of arguments specified.
  // roles = ['admin', 'lead-guide']
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform the action', 403)
      );
    }
    next();
  };
};

// User forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on the email
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    return next(new AppError('No user with the email address', 404));
  }

  // Generate a random token
  const resetToken = user.createPasswordResetToken();

  // Save the token to the user's model
  await user.save({ validateBeforeSave: false });

  
  // Send it to the user's email address
  try {
    // Create the reset URL
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    // Send email
    await new Email(user, resetURL).sendPasswordReset();

    // Send response back to client
    res.status(200).json({
      status: 'success',
      message: 'Token has been sent to your email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Please try again',
        500
      )
    );
  }
});

// User reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get the user by token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Find user by the hashed token and token expiry time
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // Check if user with the token exist
  if (!user) {
    return next(new AppError('Invalid token or expired', 400));
  }

  // if token not yet expired and there is user, set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Send response
  createSendToken(user, 200, res);
});

// User update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get current user by ID from db collection (table)
  const user = await User.findById(req.user.id).select('+password');

  // Check if current user password is correct
  if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Invalid current password', 401));
  }

  // update the user password field
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Send response
  createSendToken(user, 200, res);
});
