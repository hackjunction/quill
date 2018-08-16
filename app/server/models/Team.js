var mongoose = require('mongoose');
var validator = require('validator');

/**
 * Team Schema!
 * @type {mongoose}
 */

var schema = new mongoose.Schema({
  leader: {
    type: String
  },
  members: {
    type: [String]
  },
  teamLocked: {
    type: Boolean,
    default: false
  },
});

module.exports = mongoose.model('Team', schema);
