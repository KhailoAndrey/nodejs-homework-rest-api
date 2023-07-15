const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

const userRolesEnum = require("../constants/userRolesEnum")
const {User} = require("../models/userModel")
const catchAsync = require("../utils/catchAsync")
const AppError = require('../utils/appError')

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
})

exports.signup = catchAsync(async (req, res) => { 
    const newUserData = {
        ...req.body,
        role: userRolesEnum.STARTER,
    }
    const newUser = await User.create(newUserData)
    newUser.password = undefined;
    
    const token = signToken(newUser.id)
    
    newUser.token = token;

    await User.findByIdAndUpdate(newUser._id, { token: token }); 
    
    res.status(201).json({
        user: newUser,
    })
})

exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) throw new AppError(401, 'Not authorized!');

    const passwordIsValid = await user.checkPassword(password, user.password);

    if (!passwordIsValid) throw new AppError(401, 'Not authorized!');

    user.password = undefined;

    const token = signToken(user.id);

    user.token = token;

    res.status(200).json({
        user,
    })
})

exports.logout = catchAsync(async (req, res) => { 
    const { _id } = req.user;
  const user = await User.findByIdAndUpdate(_id, { token: "" });

  if (!user) {
    throw AppError(401, "Not authorized");
  }

  res.status(204).json();
})

exports.forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json({
            msg: "Password reset instruction sent to email...",
        });
    }

    const otp = user.createPasswordResetToken();

    await user.save();

    // send otp to email
    try {
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/set-new-password/${otp}`;
        console.log(resetUrl)

        const emailTransport = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const emailConfig = {
            from: 'From app admin',
            to: user.email,
            subject: 'Password reset instruction',
            text: resetUrl,
        };

        await emailTransport.sendMail(emailConfig);

    } catch (error) {
        console.log(error)
        user.createPasswordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();
    }
    res.status(200).json({
        msg: 'Password reset instruction sent to email...',
    });
})

exports.resetPassword = catchAsync(async (req, res) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.otp).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new AppError(400, 'Token is invalid...');

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        user,
    });
})

exports.verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw new AppError(401, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  });

  res.json({
    message: "Verification successful",
  });
};

exports.resendVerifyEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(400, "missing required field email");
  }
  if (user.verify) {
    throw new AppError(400, "Verification has already been passed");
  }

    const verifyUrl = `${req.protocol}://${req.get('host')}/users/verify/${user.verificationToken}`;

    const emailTransport = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
    });
    const emailConfig = {
            from: 'From app admin',
            to: user.email,
            subject: 'Verification email',
            text: verifyUrl,
        };
    await emailTransport.sendMail(emailConfig);
    
  res.json({
    message: "Verification email sent",
  });
};
