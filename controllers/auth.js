const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  PUBLIC
exports.register = asyncHandler(async (req, res, next) => {

  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role
  });
  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login 
// @access  PUBLIC
exports.login = asyncHandler(async (req, res, next) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide and email and password'));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user
// @route   GET /api/v1/auth/logout 
// @access  PUBLIC
exports.logout = asyncHandler(async(req, res, next) => {
  console.log(res);
  
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true
  })
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get logged in user
// @route   GET /api/v1/auth/me 
// @access  PRIVATE
exports.getLoggedInUser = asyncHandler(async(req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails 
// @access  PRIVATE
exports.updateDetails = asyncHandler(async(req, res, next) => {

  const fieldToUpdate = {
    name: req.body.name,
    email: req.body.email
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldToUpdate, {
    new: true,
    runValidators: true
  });
  

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user password
// @route   POST /api/v1/auth/updatepassword 
// @access  PRIVATE
exports.updatePassword = asyncHandler(async(req, res, next) => {

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();
  

  sendTokenResponse(user, 200, res);
});


// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword 
// @access  PUBLIC
exports.forgotPassword = asyncHandler(async(req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `
    You are receiving this email because you (or someone else) has
    requested a password reset. Please make a [PUT] request to:
    ${resetUrl}
  `;

  const options = {
    email: user.email,
    subject: 'Password reset',
    message
  };

  try {
    await sendEmail(options);
    res.status(200).json({ success: true, data: 'Email sent'});
  } catch (err) {
    console.log(err);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpired = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
  
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:ressettoken 
// @access  PUBLIC
exports.resetPassword = asyncHandler(async(req, res, next) => {

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpired: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpired = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});


const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwt();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};