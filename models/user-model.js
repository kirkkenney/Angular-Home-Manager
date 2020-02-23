const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

const ObjectId = mongoose.Types.ObjectId;

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    passwordResetToken: {
        type: String
    },
    homeGroups: [{
        type: ObjectId,
        ref: 'HomeGroups'
    }],
    homeGroupInvitations: [{
        type: ObjectId,
        ref: 'HomeGroups'
    }]
})

const User = module.exports = mongoose.model('User', UserSchema);

module.exports.getUserById = function(id, callback) {
    User.findById(id, callback);
}

module.exports.getUserByEmail = function(email, callback) {
    const query = {email: email};
    User.findOne(query, callback);
}

module.exports.addUser = function(newUser, callback) {
    bcrypt.genSalt(10, (err, salt) => {
        // generate a hashed password from user generated password
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save(callback);
        })
    })
}

module.exports.updatePassword = function(user, newPassword, callback) {
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;
            user.save(callback)
        })
    })
}

module.exports.comparePassword = function(candidatePassword, hashedPassword, callback) {
    bcrypt.compare(candidatePassword, hashedPassword, (err, isMatch) => {
        if (err) throw err;
        callback(null, isMatch);
    })
}

module.exports.updateAccount = async function(user, callback) {
    User.findById(user._id, function(err, userQuery) {
        if (!userQuery) throw err;
        userQuery.name = user.name;
        userQuery.email = user.email;
        userQuery.save(callback)
    })
}