const mongoose = require('mongoose');
const config = require('../config/database');
const User = require('../models/user-model');

const ObjectId = mongoose.Types.ObjectId;

const HomeGroupsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    chores: [{
            title: {
                type: String,
                required: true
            }
        }],
    finances: [{
            title: {
                type: String,
                required: true
            },
            incomeOrExpenditure: {
                type: String,
                required: true
            },
            monthlyOrWeekly: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Number,
                required: true
            }
        }],
    calendar: [{
            title: {
                type: String,
                required: true
            },
            eventDate: {
                type: Date,
                required: true
            }
        }],
    members: [{
        type: ObjectId,
        ref: 'User'
    }],
    pendingMembers: [{
        type: ObjectId,
        ref: 'User'
    }]
})

const HomeGroups = module.exports = mongoose.model('HomeGroups', HomeGroupsSchema);