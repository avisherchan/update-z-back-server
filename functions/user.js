const { Model } = require('mongoose');
const {} = require('mongoose')
const User = require('../schemas/user');
const mongoose = require('mongoose');
const accountSID = 'AC1a101a19b21b7a1451958be533bc2a8f'
const authToken = 'c05a4e8046b3e60825a7a4ea37caff9b'
const serviceId = 'VAe8d35c0a2ff87538a4e2f3f687893ff6'
const config = require('../config')
const client = require('twilio')(accountSID, authToken)
const formidable = require('formidable')
const fs = require('fs');
const _ = require('lodash')

exports.userById = (req, res, next, id) => {
    User.findById(id).exec((err, user) => {
        if(err||!user){
            return res.status(400).json({
                error: 'User not found'
            })
        }
        req.profile = user;
        next();
    });
}

exports.readUser = (req, res) => {
    req.profile.hpass = undefined
    req.profile.salt = undefined
    return res.json(req.profile);
}

exports.updateUser = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, (err, fields, files) => {
        if(err) {
            return res.status(400).json({
                error: "Photo could not be uploaded"
            })
        }
        // save user with the updated info
        let user = req.profile;
        user = _.extend(user, fields)
        user.updated = Date.now()

        if(files.photo) {

            if(files.photo.size > 200000) {
                return res.status(400).json({
                    error: 'Image should be less than 200kb in size. Please use a image compressor/resizer to decrease the size of your image.'
                });
            }

            user.photo.data = fs.readFileSync(files.photo.path);
            user.photo.contentType = files.photo.type;
        }

        user.save((err, result) => {
            if(err) {
                return res.status(400).json({
                    error: err
                })
            }
            user.hashed_password = undefined
            user.salt = undefined
            res.json(user)
        })
    } 
  )
}

exports.sendCode = async (req, res, next) => {
    try {
        const phoneNumber = req.body.number;
        client.verify
            .services('VAe8d35c0a2ff87538a4e2f3f687893ff6')
            .verifications.create({ to: phoneNumber, channel: 'sms' })
            .then(verification => res.send(verification));
        next();
    } catch (error) {
        res.status(401).send('Please enter a valid phone number')
    }
}

exports.verify = async (req, res, next) => {
    try {
        const phoneNumber = req.body.number;
        client.verify
            .services('VAe8d35c0a2ff87538a4e2f3f687893ff6')
            .verificationChecks.create({
                to: req.body.number,
                code: req.body.code.toString()
            })
            .then(verification_check => {
                if (verification_check.valid === true) {
                    return next();
                }
            })
            .catch(error => res.status(401).send(error));
    } catch (error) {
        res.status(401).send('Could not verify phone number');
    }
}

exports.verified = (req, res) => {
    User.findOneAndUpdate(
        {_id: req.profile._id},
        {$set: {verified: true}},
        {new: true},
        (err, user) => {
            if(err) {
                return res.json({
                    error: err
                })
            }
            user.verified = true;
            res.json(user)
        }
    )
}

exports.setNumber = (req, res) => {
    User.findOneAndUpdate(
        {_id: req.profile._id},
        {$set: {number: req.query.number}},
        {new: true},
        (err, user) => {
            if(err) {
                return res.json({
                    error: err
                })
            }
            user.number = req.query.number
            res.json({
                message: 'Number saved.'
            })
        }
    )
}

exports.userPhoto = (req, res, next) => {
    if(req.profile.photo.data) {
        res.set("Content-Type", req.profile.photo.contentType)
        return res.send(req.profile.photo.data);
    }
    next();
}