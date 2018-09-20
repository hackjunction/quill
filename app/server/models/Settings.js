var mongoose = require('mongoose');
var validator = require('validator');

/**
 * Settings Schema!
 *
 * Fields with select: false are not public.
 * These can be retrieved in controller methods.
 *
 * @type {mongoose}
 */
var reimbursementClass = {
  Finland: {
    type: Number,
    default: 20
  },
  Baltics: {
    type: Number,
    default: 40
  },
  Nordics: {
    type: Number,
    default: 60
  },
  Europe: {
    type: Number,
    default: 80
  },
  RestOfTheWorld: {
    type: Number,
    default: 150
  },
  GoldenTicket: {
    type: Number,
    default: 200
  }
};

var schema = new mongoose.Schema({
  status: String,
  timeOpen: {
    type: Number,
    default: 0
  },
  timeClose: {
    type: Number,
    default: Date.now() + 31104000000 // Add a year from now.
  },
  timeConfirm: {
    type: Number,
    default: 604800000 // Date of confirmation
  },
  timeTR: {
    type: Number,
    default: Date.now() + 31104000000 // Add a year from now.
  },
  whitelistedEmails: {
    type: [String],
    select: false,
    default: ['.edu'],
  },
  waitlistText: {
    type: String
  },
  acceptanceText: {
    type: String,
  },
  confirmationText: {
    type: String
  },
  schools: {
    type: [String]
  },
  skills: {
    type: [String],
    default: ['Python', 'C#', 'JavaScript', 'React', 'Vue', 'Photoshop', 'Sketch', 'Illustrating']
  },
  showRejection: {
    type: Boolean,
    default: false
  },
  reimbursementClass: reimbursementClass,

});

/**
 * Get the list of whitelisted emails.
 * Whitelist emails are by default not included in settings.
 * @param  {Function} callback args(err, emails)
 */
schema.statics.getWhitelistedEmails = function(callback){
  this
    .findOne({})
    .select('whitelistedEmails')
    .exec(function(err, settings){
      return callback(err, settings.whitelistedEmails);
    });
};

schema.statics.getSchools = function(callback){
  this
    .findOne({})
    .exec(function(err, settings){
      return callback(err, settings.schools);
    });
};

schema.statics.getSkills = function(callback){
  this
    .findOne({})
    .exec(function(err, settings){
      return callback(err, settings.skills)
    })
}

/**
 * Get the open and close time for registration.
 * @param  {Function} callback args(err, times : {timeOpen, timeClose, timeConfirm})
 */
schema.statics.getRegistrationTimes = function(callback){
  this
    .findOne({})
    .select('timeOpen timeClose timeConfirm timeTR')
    .exec(function(err, settings){
      callback(err, {
        timeOpen: settings.timeOpen,
        timeClose: settings.timeClose,
        timeConfirm: settings.timeConfirm,
        timeTR: settings.timeTR
      });
    });
};

schema.statics.getPublicSettings = function(callback){
  this
    .findOne({})
    .exec(callback);
};

module.exports = mongoose.model('Settings', schema);
