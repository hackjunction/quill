const _ = require('underscore');
const User = require('../models/User');
const Team = require('../models/Team')
const Settings = require('../models/Settings');
const Mailer = require('../services/email');
const Stats = require('../services/stats');

const validator = require('validator');
const csvValidation = require('../services/csvValidation').csvValidation;
const moment = require('moment');
const shuffleSeed = require('shuffle-seed');

const programmingLanguages = shuffleSeed.shuffle(require('../assets/programming_languages.json'), process.env.JWT_SECRET);

const UserController = {};

const maxTeamSize = process.env.TEAM_MAX_SIZE || 4;



// Tests a string if it ends with target s
function endsWith(s, test){
  return test.indexOf(s, test.length - s.length) !== -1;
}

//Escape special chars
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
 * Determine whether or not a user can register.
 * @param  {String}   email    Email of the user
 * @param  {Function} callback args(err, true, false)
 * @return {[type]}            [description]
 */
function canRegister(email, password, callback){

  if (!password || password.length < 6){
    return callback({ message: "Password must be 6 or more characters."}, false);
  }

  // Check if its within the registration window.
  Settings.getRegistrationTimes(function(err, times){
    if (err) {
      callback(err);
    }

    var now = Date.now();

    if (now < times.timeOpen){
      return callback({
        message: "Registration opens in " + moment(times.timeOpen).fromNow() + "!"
      });
    }

    if (now > times.timeClose){
      return callback({
        message: "Sorry, registration is closed."
      });
    } else {
      return callback(null, true);
    }
  });
}

function generateID(i){
    //var l = programmingLanguages.length;

    var l = 1000000;
    //100^3 and this v number don't share any common determinators, so the modulo will produce same results only every million participants
    var num = i * 85766121 % l; //7^6 * 3^6
    return programmingLanguages[Math.floor(num / 10000) % 100] + "-" +
            programmingLanguages[Math.floor(num / 100) % 100] + "-" +
            programmingLanguages[num % 100];
}

/**
 * Login a user given a token
 * @param  {String}   token    auth token
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithToken = function(token, callback){
  User.getByToken(token, function(err, user){
    return callback(err, token, user);
  });
};

/**
 * Login a user given an email and password.
 * @param  {String}   email    Email address
 * @param  {String}   password Password
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithPassword = function(email, password, callback){

  if (!password || password.length === 0){
    return callback({
      message: 'Please enter a password'
    });
  }

  if (!validator.isEmail(email)){
    return callback({
      message: 'Invalid email'
    });
  }

  User
    .findOneByEmail(email)
    .select('+password')
    .exec(function(err, user){
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback({
          message: "Incorrect username or password"
        });
      }
      if (!user.checkPassword(password)) {
        return callback({
          message: "Incorrect username or password"
        });
      }

      // yo dope nice login here's a token for your troubles
      var token = user.generateAuthToken();

      var u = user.toJSON();

      delete u.password;

      return callback(null, token, u);
  });
};

/**
 * Create a new user given an email and a password.
 * @param  {String}   email    User's email.
 * @param  {String}   password [description]
 * @param  {Function} callback args(err, user)
 */
UserController.createUser = function(email, password, nickname, callback) {
  if (typeof email !== "string"){
    return callback({
      message: "Incorrect email format"
    });
  }
  Settings.getRegistrationTimes(function(err, times){
    if (err) {
      callback(err);
    }

    var now = Date.now();

    if (now < times.timeOpen){
      return callback({
        message: "Registration opens in " + moment(times.timeOpen).fromNow() + "!"
      });
    }

    if (now > times.timeClose){
      return callback({
        message: "Sorry, registration is closed."
      });
    }
  });

  email = email.toLowerCase();

  // Check that there isn't a user with this email already.
  User.count(function(err, count){
    console.log(count);
    var id = generateID(count);
    console.log(id);

    canRegister(email, password, function(err, valid){

      if (err || !valid){
        return callback(err);
      }

      User
        .findOneByEmail(email)
        .exec(function(err, user){

          if (err) {
            return callback(err);
          }

          if (user) {
            return callback({
              message: 'An account for this email already exists.'
            });
          } else {

            // Make a new user
            var u = new User();
            u.email = email;
            u.nickname = nickname;
            u.password = User.generateHash(password);
            u.id = id;

            u.save(function(err){
              if (err){
                return callback(err);
              } else {
                // yay! success.
                var token = u.generateAuthToken();

                // Send over a verification email
                var verificationToken = u.generateEmailVerificationToken();
                Mailer.sendVerificationEmail(u, verificationToken);

                return callback(
                  null,
                  {
                    token: token,
                    user: u
                  }
                );
              }

            });

          }

      });
    });
  });
};

UserController.getByToken = function (token, callback) {
  User.getByToken(token, callback);
};

/**
 * Get all users.
 * It's going to be a lot of data, so make sure you want to do this.
 * @param  {Function} callback args(err, user)
 */
UserController.getAll = function (callback) {
  User.find({}, callback);
};

/**
 * Get a page of users.
 * @param  {[type]}   page     page number
 * @param  {[type]}   size     size of the page
 * @param  {Function} callback args(err, {users, page, totalPages})
 */
UserController.getPage = function(query, callback){
  var page = query.page;
  var size = parseInt(query.size);
  var text = query.filter.text;
  var sort = query.sort == 'true' ? -1 : 1;
  var textFilter = [];
  var statusFilter = [];

  var findQuery = {
      $and: [
          { $or: textFilter},
          { $and: statusFilter }
      ]
  }

  if(typeof query.filter.text != "undefined") {
    var re = new RegExp(escapeRegExp(text), 'i');
    textFilter.push({ email: re });
    textFilter.push({ 'profile.name': re });
    textFilter.push({ 'teamCode': re });
    textFilter.push({ 'profile.homeCountry': re });
    textFilter.push({ 'profile.travelFromCountry': re });
    textFilter.push({ 'profile.travelFromCity': re });
    textFilter.push({ 'profile.school': re });
    textFilter.push({ 'profile.mostInterestingTrack': re });
    textFilter.push({ 'id': re });
    textFilter.push({ 'profile.AppliedreimbursementClass': re });
    textFilter.push({ 'profile.secret': re });
  }
  else {
    findQuery = {};
  }
  console.log(query.filter)

  if(query.filter.verified === 'true') {
    statusFilter.push({'verified': 'true'});
    statusFilter.push({'status.completedProfile': 'false'});
    statusFilter.push({'status.rejected': 'false'});
  }
  else if(query.filter.submitted === 'true') {
    statusFilter.push({'status.completedProfile': 'true'});
    statusFilter.push({'status.admitted': 'false'});
    statusFilter.push({'status.rejected': 'false'});
  }
  else if(query.filter.admitted === 'true') {
    statusFilter.push({'status.admitted': 'true'});
    statusFilter.push({'status.confirmed': 'false'});
    statusFilter.push({'status.rejected': 'false'});
  }
  else if(query.filter.confirmed ==='true') {
    statusFilter.push({'status.confirmed': 'true'});
    statusFilter.push({'status.rejected': 'false'});
  }
  else if(query.filter.needsReimbursement === 'true') {
    statusFilter.push({'profile.needsReimbursement': 'true'});
    statusFilter.push({'status.rejected': 'false'});
  }
  else if(query.filter.rejected === 'true')
    statusFilter.push({'status.rejected': 'true'});
  else
   statusFilter.push({});

  User
    .find(findQuery)
    .sort({
      'timestamp': sort
    })
    .select('+status.admittedBy')
    .skip(page * size)
    .limit(size)
    .exec(function (err, users){
      if (err || !users){
        return callback(err);
      }

      User.count(findQuery).exec(function(err, count){

        if (err){
          return callback(err);
        }

        return callback(null, {
          users: users,
          page: page,
          size: size,
          totalPages: Math.ceil(count / size)
        });
      });

    });
};

UserController.getMatchmaking = function(user, query, callback){
  var type = query.type;
  var page = query.page;
  var text = query.filter.text;  
  var size = parseInt(query.size);
  
  var textFilter = [];
  var statusFilter = [];

  var findQuery = {
      $and: [
          { $or: textFilter },
          { $and: statusFilter }
      ]
  }

  if(type === 'individuals'){
    
    if(text !== undefined) {
      var re = new RegExp(escapeRegExp(text), 'i');
      textFilter.push({ 'teamMatchmaking.individual.mostInterestingTrack': re});
      textFilter.push({ 'teamMatchmaking.individual.role': re });
      textFilter.push({ 'teamMatchmaking.individual.slackHandle': re });
      textFilter.push({ 'teamMatchmaking.individual.skills': re });
    }
    else{
      findQuery = {
        'teamMatchmaking.enrolled': 'true',
        'teamMatchmaking.enrollmentType': 'individual'
      }
    }

    statusFilter.push({'teamMatchmaking.enrolled': 'true'});
    statusFilter.push({'teamMatchmaking.enrollmentType': 'individual'});

    User
    .find(findQuery)
    .skip(page * size)
    .limit(size)
    .exec(function(err, users){
      if (err || !users){
        return callback(err);
      }
      
      User.count(findQuery)
      .exec(function(err, count){
        
        if (err){
          return callback(err);
        }

        return callback(null, {
          users: users.map(user => user.teamMatchmaking),
          page: page,
          size: size,
          totalPages: Math.ceil(count / size)
        });
      })

    })
  }
  else if(type === 'teams'){
    if(text !== undefined) {
      var re = new RegExp(escapeRegExp(text), 'i');
      textFilter.push({ 'teamMatchmaking.team.mostInterestingTrack': re});
      textFilter.push({ 'teamMatchmaking.team.roles': re });
      textFilter.push({ 'teamMatchmaking.team.slackHandle': re });
      textFilter.push({ 'teamMatchmaking.team.topChallenges': re });
    }
    else{
      findQuery = {
        'teamMatchmaking.enrolled': 'true',
        'teamMatchmaking.enrollmentType': 'team'
      }
    }

    statusFilter.push({'teamMatchmaking.enrolled': 'true'});
    statusFilter.push({'teamMatchmaking.enrollmentType': 'team'});


    User
    .find(findQuery)
      .exec(function(err, users){
        if (err || !users){
          return callback(err);
        }
        //calculate team size
        var usersProcessed = 0;

        /*users.forEach(function(usr, index){
          User.find({'teamCode': usr.teamCode})
              .exec(function (err, results) {
                users[index] = [usr, results.length]
                usersProcessed += 1;
                if(usersProcessed === users.length){
                  */
          User.count(findQuery)
          .exec(function(err, count){
            
            if (err){
              return callback(err);
            }
    
            return callback(null, {
              users: users.map(user => user.teamMatchmaking),
              page: page,
              size: size,
              totalPages: Math.ceil(count / size)
            });
          })
/*
                }
          });
        })*/
      })
  }

};

//Check if users team is already in matchmaking search
UserController.teamInSearch = function(user, callback){
  User.find({'teamCode': user.teamCode})
  .exec(function (err, users) {
    if (err || !users){
      return callback(err);
    }
    var size = users.length;
    var count = 0;
    users.forEach(function(u) {
      if(u.teamMatchmaking.enrolled){
        return callback(null, true);
      }
      count += 1;
      if(count === size){
        return callback(null, false);
      }
    })
    
});
}

UserController.exitSearch = function(id, callback) {
  User.findOneAndUpdate({
    _id: id,
    'teamMatchmaking.enrolled': true
  },
    {
      $set: {
        'teamMatchmaking.enrolled': false,
        'teamMatchmaking.enrollmentType': ''
      }
    },
    {
      new: true
    },
    callback);
}

/**
 * Get a user by id.
 * @param  {String}   id       User id
 * @param  {Function} callback args(err, user)
 */
UserController.getById = function (id, callback){
  User.findById(id, callback);
};

/**
 * Update a user's profile object, given an id and a profile.
 *
 * @param  {String}   id       Id of the user
 * @param  {Object}   profile  Profile object
 * @param  {Function} callback Callback with args (err, user)
 */
UserController.updateProfileById = function (id, profile, callback){

  // Validate the user profile, and mark the user as profile completed
  // when successful.
  csvValidation(profile, function(profileValidated){
    User.validateProfile(profile, function(err){
      if (err){
        return callback({message: 'invalid profile'});
      }

      // Check if its within the registration window.
      Settings.getRegistrationTimes(function(err, times){
        if (err) {
          callback(err);
        }

        var now = Date.now();

        if (now < times.timeOpen){
          return callback({
            message: "Registration opens in " + moment(times.timeOpen).fromNow() + "!"
          });
        }

        if (now > times.timeClose){
          return callback({
            message: "Sorry, registration is closed."
          });
        }
      });

      if (!profile.submittedApplication) {
        // Send application success email after first application submission
        profile.submittedApplication = true;
        User.findById(id, function(err, user) {
          if (err) {
            console.log('Could not send email:');
            console.log(err);
          }
          Mailer.sendApplicationEmail(user);
        });
      }

      User.findOneAndUpdate({
        _id: id,
        verified: true
      },
        {
          $set: {
            'lastUpdated': Date.now(),
            'profile': profileValidated,
            'status.completedProfile': true
          }
        },
        {
          new: true
        },
        callback);
      });
  });
};

UserController.updateMatchmakingProfileById = function (id, profile, callback){
  
    // Validate the user profile, and mark the user as profile completed
    // when successful.    
    User.findOneAndUpdate({
      _id: id,
      verified: true
    },
      {
        $set: {
          'lastUpdated': Date.now(),
          'teamMatchmaking': profile,
          'status.completedProfile': true
        }
      },
      {
        new: true
      },
      callback);
};

/**
 * Update a user's confirmation object, given an id and a confirmation.
 *
 * @param  {String}   id            Id of the user
 * @param  {Object}   confirmation  Confirmation object
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.updateConfirmationById = function (id, confirmation, callback){
  csvValidation(confirmation, function(confirmationValidated){
    User.findById(id, function(err, user){

      if(err || !user){
        return callback(err);
      }

      // Make sure that the user followed the deadline, but if they're already confirmed
      // that's okay.
      if (Date.now() >= user.status.confirmBy && !user.status.confirmed){
        return callback({
          message: "You've missed the confirmation deadline."
        });
      }


        // You can only confirm acceptance if you're admitted and haven't declined.
        User.findOneAndUpdate({
          '_id': id,
          'verified': true,
          'status.admitted': true,
          'status.declined': {$ne: true}
        },
          {
            $set: {
              'lastUpdated': Date.now(),
              'confirmation': confirmationValidated,
              'status.confirmed': true,
            }
          }, {
            new: true
          },
          function(err, user) {
            if (err || !user) {
              return callback(err);
            }
            Mailer.sendConfirmationEmail(user);
            return callback(err, user);
          });
        });
    });
};

UserController.updateFileNameById = function(id, fileName, callback){
  User.findById(id, function(err, user){
    if(err || !user){
      return callback(err);
    }

    User.findOneAndUpdate({
      '_id': id,
      'verified': true,
      'status.admitted': true,
      'status.declined': {$ne: true}
    },
      {
        $set: {
          'lastUpdated': Date.now(),
          'reimbursement.fileName': fileName,
          'reimbursement.fileUploaded': true
        }
      },
        {
          new: true
        },
        function(err, user) {
          if (err || !user) {
            return callback(err);
          }
          //Mailer.sendConfirmationEmail(user); PUT TRAVEL REIMBURSEMENT MAIL HERE?
          return callback(err, user);
        });
  });
};

UserController.updateReimbursementById = function (id, reimbursement, callback){
  csvValidation(reimbursement, function(reimbursementValidated){
    Settings.getRegistrationTimes(function(err, times){

      if(Date.now() > times.timeTR){
        return callback({
          message: "You've missed the TR deadline."
        });
      }

      User.findById(id, function(err, user){

        if(err || !user){
          return callback(err);
        }

        User.findOneAndUpdate({
          '_id': id,
          'verified': true,
          'status.admitted': true,
          'status.declined': {$ne: true}
        },
          {
            $set: {
              'lastUpdated': Date.now(),
              'reimbursement': reimbursementValidated,
              'status.reimbursementApplied': true,
            }
          }, {
            new: true
          },
          function(err, user) {
            if (err || !user) {
              return callback(err);
            }
            //Mailer.sendConfirmationEmail(user); PUT TRAVEL REIMBURSEMENT MAIL HERE?
            return callback(err, user);
          });
      });
    })
  });
};

/**
 * Decline an acceptance, given an id.
 *
 * @param  {String}   id            Id of the user
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.declineById = function (id, callback){

  // You can only decline if you've been accepted.
  User.findOneAndUpdate({
    '_id': id,
    'verified': true,
    'status.admitted': true,
    'status.declined': false
  },
    {
      $set: {
        'lastUpdated': Date.now(),
        'status.confirmed': false,
        'status.declined': true,
        'teamCode': null
      }
    }, {
      new: true
    },
    function(err, user) {
      if (err || !user) {
        return callback(err);
      }
      Mailer.sendDeclinedEmail(user);
      return callback(err, user);
    });
};

/**
 * Reject an acceptance, given an id.
 *
 * @param  {String}   id            Id of the user
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.rejectById = function (id, callback){

  // You can only reject if you've been verified.
  User.findOneAndUpdate({
    '_id': id,
    'verified': true,
    'status.admitted': false,
    'status.declined': false,
    'status.rejected': false,
  },
    {
      $set: {
        'lastUpdated': Date.now(),
        'status.rejected': true,
      }
    }, {
      new: true
    },
    function(err, user) {
      if (err || !user) {
        return callback(err);
      }
      return callback(err, user);
    });
};

/**
 * Unreject an user, given an id.
 *
 * @param  {String}   id            Id of the user
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.unRejectById = function (id, callback){

  // You can only unreject if you've been verified and rejected
  User.findOneAndUpdate({
    '_id': id,
    'verified': true,
    'status.declined': false,
    'status.rejected': true,
  },
    {
      $set: {
        'lastUpdated': Date.now(),
        'status.rejected': false,
      }
    }, {
      new: true
    },
    function(err, user) {
      if (err || !user) {
        return callback(err);
      }
      return callback(err, user);
    });
};
/**
 * Verify a user's email based on an email verification token.
 * @param  {[type]}   token    token
 * @param  {Function} callback args(err, user)
 */
UserController.verifyByToken = function(token, callback){
  User.verifyEmailVerificationToken(token, function(err, email){
    User.findOneAndUpdate({
      email: new RegExp('^' + email + '$', 'i')
    },{
      $set: {
        'verified': true
      }
    }, {
      new: true
    },
    callback);
  });
};

UserController.getTeamInfo = function(id, callback) {
  User
    .findById(id)
    .populate('team')
    .select('team')
    .exec(callback)
}

/**
 * Get a specific user's teammates. NAMES ONLY.
 * @param  {String}   id       id of the user we're looking for.
 * @param  {Function} callback args(err, users)
 */
UserController.getTeammates = function(id, callback){
  User.findById(id, function(err, user){
    if (err || !user){
      return callback(err, user);
    }
    console.log('User found')
    const teamID = user.team;
    if (!teamID){
      return callback({
        message: "You're not on a team."
      });
    }
    User
      .find({
        team: teamID
      })
      .select('profile.name id')
      .exec(callback);
  });
};

UserController.createTeam = function(id, callback) {
  User.findById(id, function(err, user) {
    if (err) return callback({message: "Error finding user"})
    const t = new Team({
      leader: user.id,
      members: [user.id],
    })
    console.log(JSON.stringify(t))
    t.save(function(err){
      if (err){
        return callback(err, t);
      }
      console.log(`New team created with id ${t._id}!`)
    });
    // Update user
    User.findOneAndUpdate({
      _id: id,
      verified: true
    },{
      $set: {
        team: t._id,
        'teamMatchmaking.enrolled': false,
        'teamMatchmaking.enrollmentType': undefined
        }
      }, {
        new: true
      }, 
      callback);
  })
}

/**
 * Given a team code and id, join a team.
 * @param  {String}   id       Id of the user joining/creating
 * @param  {String}   code     Code of the proposed team
 * @param  {Function} callback args(err, users)
 */
UserController.joinTeam = function(id, code, callback){
  csvValidation(code, function(codeValidated){
    if (!code){
      return callback({
        message: "Please enter a team name."
      });
    }

    if (typeof code !== 'string') {
      return callback({
        message: "Get outta here, punk!"
      });
    }

    Team.findOne({
      _id: code
    })
    .exec(function(err, team){
      // Check to see if this team is joinable (< team max size)
      if (err || !team) return callback({message: "Team not found"})

      if (team.members.includes(id)) {
        return callback({
          message: 'User is already in this team!'
        })
      }
      if (team.members && team.members.length >= maxTeamSize) {
        return callback({
          message: "Team is full."
        });
      }
      if (team.teamLocked) {
        return callback({
          message: "This team is locked."
        })
      }
      console.log('Valid team found, adding user to it')
      User.findById(id, function(err, user) {
        if (err) return callback({message: "User not found"})
        const updatedMembers = team.members.concat([user.id])
        team.members = updatedMembers
        team.save(function(err){
          if (err){
            return callback(err, team);
          }
          console.log(`Team members updated!`)
        });
        User.findOneAndUpdate({
          _id: id,
          verified: true
        }, {
          $set: {
            team: team._id,
            'teamMatchmaking.enrolled': false,
            'teamMatchmaking.enrollmentType': undefined
            }
          }, {
            new: true
          }, 
          callback
        );
      })
    });
  });
};

/**
 * Given a team id, lock the team
 * @param {String} id Id of the team
 * @param {Function}  callback args(err, team)
 */
UserController.lockTeam = function(id, callback){
  User.findById(id, function(err, user) {
    if (err | !user) return callback({message: 'Something went wrong'})
    Team.findById(user.team, function(err, team) {
      if(team.leader !== user.id) return callback({message: 'Only team leader can lock in the team'})
      team.teamLocked = true
      team.save(function(err) {
        if(err) return callback(err, team)
        console.log('Team locked!')
        return callback(null, team)
      })
    })
  })
}

/**
 * Given an user ID, kick them from team if the one making request is the team leader
 * @param {String}  id  _id of the one making request
 * @param {String}  userID  ID of the user being kicked
 */

UserController.kickFromTeam = function(id, userID, callback) {
  User.findById(id, function(err, user) {
    if (err || !user){
      return callback({message: 'User not found'});
    }
    Team.findById(user.team, function(err, team) {
      if (err || !team){
        return callback({message: 'Team not found'});
      }
      if(user.id !== team.leader) return callback({message: `You're not the team leader!`})
      User.findOneAndUpdate({
        id: userID,
        team: team._id
      }, {
        $set: {
          team: null,
          'teamMatchmaking.enrolled': false,
          'teamMatchmaking.enrollmentType': undefined
          }
        }, {
          new: true
        }, function(err, u) {
          if(err || !u) return callback({message: 'User not found!'})
          const userIndex = team.members.indexOf(u.id)
          team.members.splice(userIndex, 1)
          team.save(function(err) {
            if(err) return callback({message: 'Error updating team'})
            return callback(null, team)
          })
      })
    })
  })
}

/**
 * Given an id, remove them from any teams.
 * @param  {[type]}   id       Id of the user leaving
 * @param  {Function} callback args(err, user)
 */
UserController.leaveTeam = function(id, callback){
  User.findById(id, function(err, user) {
    if (err || !user){
      return callback({message: 'User not found'});
    }
    const teamID = user.team
    Team.findById(user.team).exec(function(err, team) {
      if (err || !team) {
        return callback({message: 'Team not found'})
      }
      const leaderID = team.leader
      const userIndex = team.members.indexOf(id)
      team.members.splice(userIndex, 1) // Remove user from team
      if (leaderID === user.id) {
        team.leader = team.members[0]
      }
      if (team.members.length){
        team.save(function(err){
          if (err){
            return callback(err, team);
          }
          console.log('Team updated after user left the team')
        })
      } else {
        Team.deleteOne({_id: user.team}, function(err) {
          if (err) return callback('Error deleting team')
          console.log(`Deleted team with id ${teamID}`)
        })
      }
      user.teamMatchmaking.enrolled = false
      user.teamMatchmaking.enrollmentType = undefined
      user.teamMatchmaking.team.mostInterestingTrack = undefined
      user.teamMatchmaking.team.topChallenges = undefined
      user.teamMatchmaking.team.roles = undefined
      user.teamMatchmaking.team.slackHandle = undefined
      user.teamMatchmaking.team.freeText = undefined
      user.team = null
      user.teamName = null

      user.save(function(err) {
        if(err) return callback(err, user)
        console.log('User saved after leaving team')
        return callback(null, user)
      })
    })
  });
};

/**
 * Resend an email verification email given a user id.
 */
UserController.sendVerificationEmailById = function(id, callback){
  User.findOne(
    {
      _id: id,
      verified: false
    },
    function(err, user){
      if (err || !user){
        return callback(err);
      }
      var token = user.generateEmailVerificationToken();
      Mailer.sendVerificationEmail(user, token);
      return callback(err, user);
  });
};

UserController.sendEmailsToNonCompleteProfiles = function(callback) {
  User.find({"status.completedProfile": false}, 'email nickname', function (err, users) {
    if (err) {
      return callback(err);
    }
    Mailer.sendLaggerEmails(users);
    return callback(err);
  });
}

UserController.sendRejectEmails = function(callback) {
  User.find({"status.rejected": true}, 'email nickname', function (err, users) {
    if (err) {
      return callback(err);
    }
    Mailer.sendRejectEmails(users);
    return callback(err);
  });
}

/*UserController.sendQREmails = function(callback) {
  User.find({"status.confirmed": true}, 'email nickname', function (err, users) {
    if (err) {
      return callback(err);
    }
    Mailer.sendQREmails(users);
    return callback(err);
  });
}*/

/**
 * Password reset email
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
UserController.sendPasswordResetEmail = function(email, callback){
  User
    .findOneByEmail(email)
    .exec(function(err, user){
      if (err || !user){
        return callback(err);
      }

      var token = user.generateTempAuthToken();
      Mailer.sendPasswordResetEmail(user, token, callback);
    });
};

/**
 * UNUSED
 *
 * Change a user's password, given their old password.
 * @param  {[type]}   id          User id
 * @param  {[type]}   oldPassword old password
 * @param  {[type]}   newPassword new password
 * @param  {Function} callback    args(err, user)
 */
UserController.changePassword = function(id, oldPassword, newPassword, callback){
  if (!id || !oldPassword || !newPassword){
    return callback({
      message: 'Bad arguments.'
    });
  }

  User
    .findById(id)
    .select('password')
    .exec(function(err, user){
      if (user.checkPassword(oldPassword)) {
        User.findOneAndUpdate({
          _id: id
        },{
          $set: {
            password: User.generateHash(newPassword)
          }
        }, {
          new: true
        },
        callback);
      } else {
        return callback({
          message: 'Incorrect password'
        });
      }
    });
};

/**
 * Reset a user's password to a given password, given a authentication token.
 * @param  {String}   token       Authentication token
 * @param  {String}   password    New Password
 * @param  {Function} callback    args(err, user)
 */
UserController.resetPassword = function(token, password, callback){
  if (!password || !token){
    return callback({
      message: 'Bad arguments'
    });
  }

  if (password.length < 6){
    return callback({
      message: 'Password must be 6 or more characters.'
    });
  }

  User.verifyTempAuthToken(token, function(err, id){

    if(err || !id){
      return callback(err);
    }

    User
      .findOneAndUpdate({
        _id: id
      },{
        $set: {
          password: User.generateHash(password)
        }
      }, function(err, user){
        if (err || !user){
          return callback(err);
        }

        Mailer.sendPasswordChangedEmail(user);
        return callback(null, {
          message: 'Password successfully reset!'
        });
      });
  });
};

/**
 * [ADMIN ONLY]
 *
 * Admit a user.
 * @param  {String}   userId      User id of the admit
 * @param  {String}   user        User doing the admitting
 * @param  (String)   reimbClass  Users accepted reimbursement class/amount
 * @param  {Function} callback args(err, user)
 */
UserController.admitUser = function(id, user, reimbClass, callback){
  // ReimbClass was not set
  if(reimbClass == null) {
    reimbClass = "None";
  }
  Settings.getRegistrationTimes(function(err, times){
    User
      .findOneAndUpdate({
        '_id': id,
        'verified': true,
        'status.rejected': false
      },{
        $set: {
          'status.admitted': true,
          'status.admittedBy': user.email,
          'status.confirmBy': times.timeConfirm,
          'profile.AcceptedreimbursementClass': reimbClass
        }
      }, {
        new: true
      },
      function(err, user) {
        if (err || !user) {
          return callback(err);
        }
        Mailer.sendAdmittanceEmail(user);
        return callback(err, user);
      });
    });
  };

/**
 * [ADMIN ONLY]
 *
 * Check in a user.
 * @param  {String}   userId   User id of the user getting checked in.
 * @param  {String}   user     User checking in this person.
 * @param  {Function} callback args(err, user)
 */
UserController.checkInById = function(id, user, callback){
  User.findOneAndUpdate({
    _id: id,
    verified: true
  },{
    $set: {
      'status.checkedIn': true,
      'status.checkInTime': Date.now()
    }
  }, {
    new: true
  },
  callback);
};

/**
 * [ADMIN ONLY]
 *
 * Check in a user.
 * @param  {String}   userId   User id of the user getting checked in.
 * @param  {String}   user     User checking in this person.
 * @param  {Function} callback args(err, user)
 */
UserController.QRcheckInById = function(id, callback){
  User.findOne({'id': id, 'status.admitted':true}, function(err, user){
    if(err) callback(err);
    else if(user) {
      /*if(user.status.checkedIn){
        return callback("User already checked in!", null)
      }*/
      if(user.status.rejected){
        return callback("User is rejected!", null)
      }
      if(!user.status.confirmed){
        return callback("User not confirmed!", null)
      }
      return callback(err, user)
      /*user.set({ 'status.checkedIn': true, 'status.checkInTime': Date.now() });
      user.save(function(err, user){
        if(err) return callback(err);
        return callback(err, user);
      })*/
    }
    else {
      return callback("No user found", null)
    }
  })
};

/**
 * [ADMIN ONLY]
 *
 * Check out a user.
 * @param  {String}   userId   User id of the user getting checked out.
 * @param  {String}   user     User checking in this person.
 * @param  {Function} callback args(err, user)
 */
UserController.checkOutById = function(id, user, callback){
  User.findOneAndUpdate({
    _id: id,
    verified: true
  },{
    $set: {
      'status.checkedIn': false
    }
  }, {
    new: true
  },
  callback);
};


/**
 * [ADMIN ONLY]
 */

UserController.getStats = function(callback){
  return callback(null, Stats.getUserStats());
};

module.exports = UserController;
