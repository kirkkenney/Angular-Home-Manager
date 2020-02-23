const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const config = require('../config/database');
const bcrypt = require('bcryptjs');

// Register route
router.post('/register', (req, res) => {
    let newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    })

    User.addUser(newUser, (err, user) => {
        if (err) {
            res.json({success: false, msg: 'Failed to register new user'})
        } else {
            res.json({success: true, msg: 'New user registration completed'})
        }
    })
})

// User authentication route
router.post('/authenticate', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    // call User model function, passing in user supplied email and password
    User.getUserByEmail(email, (err, user) => {
        if (err) throw err;
        if (!user) {
            return res.json({success: false, msg: 'No user found with that email address'})
        }
        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            // if user found and passwords match, generate token
            if (isMatch) {
                const token = jwt.sign({data: user}, config.secret, {
                    expiresIn: 604800 // token expiration 1 week
                })
                res.json({
                    success: true,
                    token: `Bearer ${token}`,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email
                    }
                })
            } else {
                return res.json({success: false, msg: 'Password incorrect'})
            }
        })
    })
})

// User profile route
router.get('/profile', passport.authenticate('jwt', {session:false}), (req, res) => {
    res.json({user: req.user})
})

router.post('/update-user', (req, res) => {
    const user = {
        _id: req.body._id,
        name: req.body.name,
        email: req.body.email
    }
    User.updateAccount(user, (err, user) => {
        if (err) {
            res.json({success: false, msg: 'Failed to update details. Please try again later.'})
        } else {
            res.json({success: true, msg: 'Details successfully updated.'})
        }
    })
})

router.post('/get-email', (req, res) => {
    const email = req.body.email;
    User.findOne({email: email}, function(err, results) {
        if (err) {
            return res.json({ success: false, msg: 'Unable to register at this time. Please try again later.' })
        }
        // check that email address is already found via "results"
        // also check that user's _id property is not the same as the _id
        // property on results returned from DB (to prevent update failing
        // due to email address already being in use by the user)
        if (results && req.body._id != results._id) {
            console.log(results)
            return res.json({ success: false, msg: 'Email address already in use. Please use another.' })
        } else {
            return res.json({ success: true })
        }
    })
})

router.post('/update-password', (req, res) => {
    const userId = req.body._id;
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword
    User.findById(userId, (err, user) => {
        if (err) {
            return res.json({ success: false, msg: 'Unable to update password at this time. Please try again.' })
        }
        User.comparePassword(currentPassword, user.password, (err, isMatch) => {
            if (err) {
                return res.json({ success: false, msg: 'Unable to update password at this time. Please try again.' })
            }
            if (isMatch) {
                User.updatePassword(user, newPassword, (err, userDetails) => {
                    if (err) {
                        res.json({success: false, msg: 'Unable to update password at this time. Please try again.'})
                    } else {
                        res.json({success: true, msg: 'Password successfully updated'});
                    }
                })
            } else {
                return res.json({ success: false, msg: 'Current Password is incorrect. Please try again.'})
            }
        })
    });
})

module.exports = router;