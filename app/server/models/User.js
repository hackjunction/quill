var mongoose   = require('mongoose'),
    bcrypt     = require('bcrypt-nodejs'),
    validator  = require('validator'),
    jwt        = require('jsonwebtoken');
    JWT_SECRET = process.env.JWT_SECRET;

var profile = {

  // Basic info
  name: {
    type: String,
    min: 1,
    max: 100,
  },

  age: {
    type: Number,
    min: 18,
    max: 65,
  },

  specialNeeds: {
    type: String,
    max: 500,
  },

  travelFromCountry: {
    type: String,
    min: 4,
    max: 120,
  },

  travelFromCity: {
    type: String,
    min: 2,
    max: 120,
  },

  homeCountry: {
    type: String,
    min: 4,
    max: 120,
  },

  school: {
    type: String,
    min: 1,
    max: 150,
  },

  description: {
    type: String,
    min: 0,
    max: 300
  },

  essay: {
    type: String,
    min: 0,
    max: 1500
  },

  gender: {
    type: String,
    enum : {
      values: 'M F O N'.split(' ')
    }
  },

  needsReimbursement: Boolean,
  applyAccommodation: Boolean,

  mostInterestingTrack: {
    type: String,
    max: 120,
  },

  portfolio: {
    type: String,
    min: 5,
    max: 240,
  },

  // Multiple choice
  occupationalStatus: {
    type: [String],
    max: 150
  },

  // Multiple choice
  bestTools: {
    type: [String]
  },

  codingExperience: {
    type: String,
    enum : {
      values: 'None,1,1-2,3-5,5+'.split(',')
    }
  },

  jobOpportunities: String,

  howManyHackathons: {
    type: String,
    enum : {
      values: 'None,1,2-5,5-10,10+'.split(',')
    }
  },

  previousJunction: {
    type: [String]
  },

  secret: {
    type: String,
    max: 100,
  },

  freeComment: {
    type: String,
    max: 500,
  },

  operatingSystem: {
    type: String
  },

  spacesOrTabs: {
    type: String,
    enum: {
      values: 'Spaces Tabs'.split(' ')
    }
  },

  conduct: Boolean,
  termsAndCond: Boolean

};

// Only after confirmed
var confirmation = {
  dietaryRestrictions: [String],
  shirtSize: {
    type: String,
    enum: {
      values: 'XS S M L XL XXL'.split(' ')
    }
  },
  wantsHardware: Boolean,
  hardware: String,
  notes: String,
  phone: {
    type: String,
    min: 6,
    max: 20,
  },
};

var status = {
  /**
   * Whether or not the user's profile has been completed.
   * @type {Object}
   */
  completedProfile: {
    type: Boolean,
    required: true,
    default: false,
  },
  admitted: {
    type: Boolean,
    required: true,
    default: false,
  },
  admittedBy: {
    type: String,
    validate: [
      validator.isEmail,
      'Invalid Email',
    ],
    select: false
  },
  confirmed: {
    type: Boolean,
    required: true,
    default: false,
  },
  declined: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkedIn: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkInTime: {
    type: Number,
  },
  confirmBy: {
    type: Number
  },
  reimbursementGiven: {
    type: Boolean,
    default: false
  }
};

var reimbursement = {
   fullName: {
     type: String,
     max: 60
   },
   dateOfBirth: {
     type: Date
   },
   addressLine1: {
     type: String,
     max: 20
   },
   addressLine2: {
     type: String,
     max: 20
   },
   stateProvinceRegion: {
     type: String,
     max: 20
   },
   bankInformation: {
     countryOfBank: {
       type: String,
       max: 30
     },
     nameOfBank: {
       type: String,
       max: 60
     },
     address: {
       type: String,
       default: '',
       max: 50
     },
     zipCode: {
       type: String,
       default: '',
       max: 10
     },
     iban: {
       type: String,
       default: '',
       max: 32
     },
     accountNumber: {
       type: String,
       default: '',
       max: 30
     },
     swiftOrBicOrClearingCode: {
       type: String,
       default: '',
       max: 11
     },
     brokerageInfo: {
       type: String,
       default: '',
       max: 50

     },
     additional: {
       type: String,
       default: '',
       max: 200
     },

   }
}

// define the schema for our admin model
var schema = new mongoose.Schema({

  email: {
      type: String,
      required: true,
      validate: [
        validator.isEmail,
        'Invalid Email',
      ]
  },

  nickname: {
    type: String,
    min: 1,
    max: 100,
    required: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  admin: {
    type: Boolean,
    required: true,
    default: false,
  },

  timestamp: {
    type: Number,
    required: true,
    default: Date.now(),
  },

  lastUpdated: {
    type: Number,
    default: Date.now(),
  },

  teamCode: {
    type: String,
    min: 0,
    max: 140,
  },

  verified: {
    type: Boolean,
    required: true,
    default: false
  },

  salt: {
    type: Number,
    required: true,
    default: Date.now(),
    select: false
  },

  /**
   * User Profile.
   *
   * This is the only part of the user that the user can edit.
   *
   * Profile validation will exist here.
   */
  profile: profile,

  /**
   * Confirmation information
   *
   * Extension of the user model, but can only be edited after acceptance.
   */
  confirmation: confirmation,

  status: status,

  reimbursement: reimbursement,

});

schema.set('toJSON', {
  virtuals: true
});

schema.set('toObject', {
  virtuals: true
});

//=========================================
// Instance Methods
//=========================================

// checking if this password matches
schema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Token stuff
schema.methods.generateEmailVerificationToken = function(){
  return jwt.sign(this.email, JWT_SECRET);
};

schema.methods.generateAuthToken = function(){
  return jwt.sign(this._id, JWT_SECRET);
};

/**
 * Generate a temporary authentication token (for changing passwords)
 * @return JWT
 * payload: {
 *   id: userId
 *   iat: issued at ms
 *   exp: expiration ms
 * }
 */
schema.methods.generateTempAuthToken = function(){
  return jwt.sign({
    id: this._id
  }, JWT_SECRET, {
    expiresInMinutes: 60,
  });
};

//=========================================
// Static Methods
//=========================================

schema.statics.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

/**
 * Verify an an email verification token.
 * @param  {[type]}   token token
 * @param  {Function} cb    args(err, email)
 */
schema.statics.verifyEmailVerificationToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, email){
    return callback(err, email);
  });
};

/**
 * Verify a temporary authentication token.
 * @param  {[type]}   token    temporary auth token
 * @param  {Function} callback args(err, id)
 */
schema.statics.verifyTempAuthToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, payload){

    if (err || !payload){
      return callback(err);
    }

    if (!payload.exp || Date.now() >= payload.exp * 1000){
      return callback({
        message: 'Token has expired.'
      });
    }

    return callback(null, payload.id);
  });
};

schema.statics.findOneByEmail = function(email){
  return this.findOne({
    email: new RegExp('^' + email + '$', 'i')
  });
};

/**
 * Get a single user using a signed token.
 * @param  {String}   token    User's authentication token.
 * @param  {Function} callback args(err, user)
 */
schema.statics.getByToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, id){
    if (err) {
      return callback(err);
    }
    this.findOne({_id: id}, callback);
  }.bind(this));
};

schema.statics.validateProfile = function(profile, cb){
  return cb(!(
    profile.name.length > 0 &&
    profile.conduct &&
    profile.termsAndCond &&
    ['M', 'F', 'O', 'N'].indexOf(profile.gender) > -1
    ));
};

//=========================================
// Virtuals
//=========================================

/**
 * Has the user completed their profile?
 * This provides a verbose explanation of their furthest state.
 */
schema.virtual('status.name').get(function(){

  if (this.status.checkedIn) {
    return 'checked in';
  }

  if (this.status.declined) {
    return "declined";
  }

  if (this.status.confirmed) {
    return "confirmed";
  }

  if (this.status.admitted) {
    return "admitted";
  }

  if (this.status.completedProfile){
    return "submitted";
  }

  if (!this.verified){
    return "unverified";
  }

  return "incomplete";

});

module.exports = mongoose.model('User', schema);
