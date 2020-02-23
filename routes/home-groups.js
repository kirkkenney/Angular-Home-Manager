const express = require('express');
const router = express.Router();
const HomeGroups = require('../models/home-group-model');
const User = require('../models/user-model');
const config = require('../config/database');


router.post('/create', (req, res) => {
    let newHomeGroup = new HomeGroups({
        name: req.body.homeGroup.name
    });
    const userQuery = req.body.user.user._id;
    User.findById(userQuery, async (err, user) => {
        if (err) {
            return res.json({success: false, msg: 'Oops! Something went wrong. Please try again later.'})
        }
        // add user to HomeGroup members property
        newHomeGroup.members.push(userQuery)
        await newHomeGroup.save()
        // add HomeGroup to User homeGroups property
        user.homeGroups.push(newHomeGroup._id)
        user.save()
        return res.json({success: true, msg: `${newHomeGroup.name} created.`})
    })
})

router.post('/all-home-groups', async (req, res) => {
    let user = req.body._id;
    const userQuery = await User.findById(user);
    // if user is found, go on to find corresponding HomeGroups data
    if (userQuery) {
        let homeGroupsQuery = await HomeGroups.find({'_id': { '$in': userQuery.homeGroups }}).populate('members').populate('pendingMembers');
        // if HomeGroups data is found, return it to the front-end
        if (homeGroupsQuery) {
            return res.json({success: true, data: homeGroupsQuery})
        // if HomeGroups data cannot be found, return error message to user
        } else {
            return res.json({success: false, msg: "Oops! Couldn't get Home Group details! Please try again."})
        }
    // if User data cannot be found, return error message to user
    } else {
        return res.json({success: false, msg: "Oops! Couldn't get Home Group details! Please try again."})
    }
})

router.post('/create-chore', (req, res) => {
    const homeGroupQuery = req.body.homeGroup;
    const choreData = req.body.choreData;
    HomeGroups.findById(homeGroupQuery.id, (err, homeGroup) => {
        if (err) {
            return res.json({success: false, msg: 'Oops something went wrong. Please try again later.'})
        }
        homeGroup.chores.push(choreData);
        homeGroup.save()
        return res.json({success: true, msg: `${choreData.title} successfully added to ${homeGroup.name}`})
    })
})

router.post('/create-calendar', (req, res) => {
    const homeGroupQuery = req.body.homeGroup._id;
    const calendarQuery = req.body.calendarData;
    HomeGroups.findById(homeGroupQuery, (err, homeGroup) => {
        if (err) {
            return res.json({success: false, msg: 'Oops something went wrong, please try again later.'})
        }
        const calendarEvent = {
            title: calendarQuery.title,
            eventDate: calendarQuery.date
        }
        homeGroup.calendar.push(calendarEvent);
        homeGroup.save();
        return res.json({success: true, msg: `${calendarEvent.title} added to ${homeGroup.name}`})
    })
})

router.post('/create-finance', (req, res) => {
    const homeGroupQuery = req.body.homeGroup._id 
    const financeQuery = req.body.financeData;
    HomeGroups.findById(homeGroupQuery, (err, homeGroup) => {
        if (err) {
            return res.json({success: false, msg: 'Oops! Something went wrong. Please try again later.'})
        }
        const financeEvent = {
            title: financeQuery.title,
            incomeOrExpenditure: financeQuery.isExpenditureOrIncome,
            monthlyOrWeekly: financeQuery.isMonthlyOrWeekly,
            amount: financeQuery.amount,
            date: financeQuery.date
        }
        homeGroup.finances.push(financeEvent);
        homeGroup.save()
        return res.json({success: true, msg: `${financeEvent.title} successfully added to ${homeGroup.name}`})
    })
})

router.post('/delete-chore', (req, res) => {
    const homeGroupQuery = req.body.homeGroup._id;
    const choreQuery = req.body.chore._id;
    HomeGroups.updateOne(
        { _id: homeGroupQuery },
        { "$pull": { "chores": { _id: choreQuery } } },
        (err, homeGroup) => {
            if (err) {
                return res.json({success: false, msg: 'Oops! Unable to delete chore at this time. Please try again later.'})
            }
            return res.json({success: true, msg: 'Chore successfully deleted.'})
        }
    )
})

router.post('/delete-calendar-event', (req, res) => {
    const homeGroupQuery = req.body.homeGroup._id;
    const calendarQuery = req.body.calendarEvent._id;
    HomeGroups.updateOne(
        { _id: homeGroupQuery },
        { "$pull": { "calendar": { _id: calendarQuery } } },
        (err, homeGroup) => {
            if (err) {
                return res.json({success: false, msg: 'Oops! Unable to delete calendar event at this time. Please try again later.'})
            }
            return res.json({success: true, msg: 'Calendar event successfully deleted.'})
        }
    )
})

router.post('/delete-finance-event', (req, res) => {
    const homeGroupQuery = req.body.homeGroup._id;
    const financeQuery = req.body.financeEvent._id;
    HomeGroups.updateOne(
        { _id: homeGroupQuery },
        { "$pull": { "finances": { _id: financeQuery } } },
        (err, homeGroup) => {
            if (err) {
                return res.json({success: false, msg: 'Oops! Unable to delete finance event at this time. Please try again later.'})
            }
            return res.json({success: true, msg: 'Finance event successfully deleted.'})
        }
    )
})

router.post(`/invite-to-home-group`, (req, res) => {
    const email = req.body.email
    const homeGroupId = req.body.homeGroup._id
    User.findOne({ email: email }, async (err, user) => {
        if (!user) {
            // check if invited member exists
            return res.json({success: false, msg: 'Unable to find user with that email address'})
        } else {
            // if invited member exists, get HomeGroup being queried
            const homeGroup = await HomeGroups.findById(homeGroupId)
            // check if invited user ID is already contained in the HomeGroup
            // pendingMembers array
            if (homeGroup.pendingMembers.indexOf(user._id) !== -1) {
                return res.json({ success: false, msg: `${user.email} already has a pending invitation to ${homeGroup.name}` })
            // check if invited user ID is already contained in the HomeGroup
            // members array
            } else if (homeGroup.members.indexOf(user._id) !== -1) {
                return res.json({ success: false, msg: `${user.email} is already a member of ${homeGroup.name}` })
            } else {
                // if user exists, and not already accounted for in
                // pendingMembers or members arrays, add user ID to HomeGroup
                // pending members, and add HomeGroup to user homeGroup
                // invitations
                homeGroup.pendingMembers.push(user._id)
                await homeGroup.save()
                user.homeGroupInvitations.push(homeGroupId)
                user.save()
                res.json({success: true, msg: `Invitation sent to ${email}`})
            }
        }
    })
})

router.post('/get-homegroup-invitations', async (req, res) => {
    const invitations = req.body.homeGroupInvitations;
    let homeGroupInvitations = [];
    for (let i = 0; i < invitations.length; i++) {
        await HomeGroups.findOne({ _id: invitations[i] }, (err, homeGroup) => {
            if (err) {
                console.log(err)
            } else {
                homeGroupInvitations.push(homeGroup)
            }
        })
    }
    if (homeGroupInvitations.length > 0) {
        return res.json({ success: true, homeGroups: homeGroupInvitations })
    } else {
        return res.json({ success: true, homeGroups: homeGroupInvitations })
    }
})

router.post('/accept-homegroup-invitations', (req, res) => {
    const userQuery = req.body.user._id 
    const homeGroupsQuery = req.body.homeGroups 
    User.findById(userQuery, (err, user) => {
        if (err) {
            return res.json({success: false, msg: 'Unable to update at this time. Please try again later.'})
        }
        for (let i = 0; i < homeGroupsQuery.length; i++) {
            if (homeGroupsQuery[i].checked) {
                // remove member's ID from HomeGroup pendingMembers array
                HomeGroups.updateOne(
                    { _id: homeGroupsQuery[i]._id },
                    { "$pull": { "pendingMembers": { _id: userQuery } } }, (err, homeGroup) => {
                        if (err) throw err;
                    }
                )
                // add member's ID to HomeGroup members array
                HomeGroups.updateOne(
                    { _id: homeGroupsQuery[i]._id },
                    { "$push": { "members": { _id: userQuery } } }, (err, homeGroup) => {
                        if (err) throw err;
                    }
                )
                // add homeGroup ID to user's homeGroups array
                user.homeGroups.push(homeGroupsQuery[i]._id)
                // remove homeGroup ID from user's homeGroupInvitations array
                user.homeGroupInvitations.pull(homeGroupsQuery[i]._id)
            } else {
                user.homeGroupInvitations.pull(homeGroupsQuery[i]._id)
            }
        }
        user.save()
        return res.json({success: true, msg: 'Home Groups successfully updated.'})
    })
})


module.exports = router;