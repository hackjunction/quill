var UserController = require('../controllers/UserController');
var SettingsController = require('../controllers/SettingsController');

var aws = require('aws-sdk');
//var qrcode = require('qrcode-generator');
var request = require('request');
var multer = require('multer');
var multerS3 = require('multer-s3');
var sanitize = require('mongo-sanitize');

var config = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
}

var s3 = new aws.S3(config);

/*
var storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})*/

module.exports = function(router) {

  function getToken(req){
    return req.headers['x-access-token'];
  }

  /**
   * Using the access token provided, check to make sure that
   * you are, indeed, an admin.
   */
  function isAdmin(req, res, next){

    var token = getToken(req);

    UserController.getByToken(token, function(err, user){

      if (err) {
        return res.status(500).send(err);
      }

      if (user && user.admin){
        req.user = user;
        return next();
      }

      return res.status(401).send({
        message: 'Get outta here, punk!'
      });

    });
  }

  function isAdminOrVolunteer(req, res, next){
    
        var token = getToken(req);
    
        UserController.getByToken(token, function(err, user){
    
          if (err) {
            return res.status(500).send(err);
          }
    
          if (user){
            if(user.admin || user.volunteer){
              req.user = user;
              return next();
            }
          }
    
          return res.status(401).send({
            message: 'Get outta here, punk!'
          });
    
        });
      }

  /**
   * [Users API Only]
   *
   * Check that the id param matches the id encoded in the
   * access token provided.
   *
   * That, or you're the admin, so you can do whatever you
   * want I suppose!
   */
  function isOwnerOrAdmin(req, res, next){
    var token = getToken(req);
    var userId = req.params.id;

    UserController.getByToken(token, function(err, user){

      if (err || !user) {
        return res.status(500).send(err);
      }

      if (user._id == userId || user.admin){
        return next();
      }
      return res.status(400).send({
        message: 'Token does not match user id.'
      });
    });
  }

  /**
   * Default response to send an error and the data.
   * @param  {[type]} res [description]
   * @return {[type]}     [description]
   */
  function defaultResponse(req, res){
    return function(err, data){
      if (err){
        // SLACK ALERT!
        if (process.env.NODE_ENV === 'production'){
          request
            .post(process.env.SLACK_HOOK,
              {
                form: {
                  payload: JSON.stringify({
                    "text":
                    "``` \n" +
                    "Request: \n " +
                    req.method + ' ' + req.url +
                    "\n ------------------------------------ \n" +
                    "Body: \n " +
                    JSON.stringify(req.body, null, 2) +
                    "\n ------------------------------------ \n" +
                    "\nError:\n" +
                    JSON.stringify(err, null, 2) +
                    "``` \n"
                  })
                }
              },
              function (error, response, body) {
                return res.status(500).send(err);
              }
            );
        } else {
          return res.status(500).send(err);
        }
      } else {
        return res.json(data);
      }
    };
  }

  /**
   *  API!
   */

  /*
  QR-CODE GENERATION
  */

  /*function generateQR(data){
    var typeNumber = 2;
    var errorCorrectionLevel = 'L';
    var qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(data);
    qr.make();
    return qr.createImgTag(8); 
  }

  router.get('/qr/:id', function(req, res) {
    var id = req.params.id;
    res.send(generateQR(id));
  });*/

  //Checking in with QR

   /**
   * FILE UPLOAD
   */

   router.post('/upload/:filename', function(req, res) {
     var token = getToken(req);

     UserController.getByToken(token, function(err, user){
      SettingsController.getRegistrationTimes(function(err, times){
        if (err) {
          return res.sendStatus(500);
        }
        if (Date.now() > times.timeTR){
          return res.sendStatus(404);
        }
      });

       if (err) {
         return res.sendStatus(500);
       }

       if (user){

        if(!user.status.confirmed || (user.profile.AcceptedreimbursementClass === 'None') || !user.profile.AcceptedreimbursementClass){
          return res.sendStatus(403);
        }
        var upload = multer({
          //create storage using multerS3
          storage: multerS3({
            s3: s3,
            bucket: 'junction-2018-travel-grant-receipts',
            contentType: multerS3.AUTO_CONTENT_TYPE,
            metadata: function(req, file, cb) {
              cb(null, {fieldName: file.fieldname});
            },
            key: function(req,file,cb) {
                //get the date right by adding the offset of timezone
                //set the file name by user information so that if the user uploads a new file, it replaces the old one in S3
                var filename = user.profile.name.split(' ').join('_') + '_' + user.id + '_receipts' + '.pdf';
                cb(null, filename)
            }
          }),
          //custom filters to filter out everything except pdf files
          fileFilter: function (req, file, cb) {
            if (file.mimetype !== 'application/pdf') {
              req.fileValidationError = 'File not pdf';
              return cb(null, false);
            }
            cb(null, true);
          },
          //Limit the filesize to 2MB
          limits: { fileSize: 2000000 }

         }).single('file');

        

        upload(req, res, function(err) {
          if(req.fileValidationError){
            return res.sendStatus(400, "The file format is not pdf.");
          }
          if(err){
            //give different error if the error is related to file size
            if(err.code === 'LIMIT_FILE_SIZE'){
              return res.sendStatus(413);
            }
            console.log(err)
            return res.sendStatus(400);
          }
          //Update the fileName field for the user, so that user can see if they uploaded a file already (even if they didn't submit the form)
          UserController.updateFileNameById(user._id, sanitize(req.params.filename), defaultResponse(req, res));
        });
      }
     });

   });


   router.get('/search/school/', function(req, res) {
     var results = [];
     results.push({
       "name": 'Type in your school',
       "id": 'Undefined school'
     });
     var response = {
       'results': results
     };
     return res.json(response);
   });

   router.get('/search/skills/', function(req, res) {
    var results = [];
    results.push({
      "name": 'Type in your skills',
      "id": 'Undefined skill'
    });
    var response = {
      'results': results
    };
    return res.json(response);
  });


   // School search
   router.get('/search/school/:query', function(req, res) {
     var params = sanitize(req.params);
     var query = params.query;
     query = query.replace(/[!@#$<>%^*()]/g, "");
     SettingsController.getSchools(function(err, schools) {
       if (err) {
         res.sendStatus(500);
       }
       var results = [];
       var i = 0;
       while (i < schools.length) {
         var school = schools[i];
         if (school.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
           results.push({
             "name": school,
             "id": school
           });
         }
         if (results.length > 50) {
           break;
         }
         i++;
       }
       if (results.length === 0) {
         results.push({
           "name": query,
           "id": query
         });
       }

       var data = {
         "results": results
       };

       return res.json(data);
     });
   });

   //Skills search
   router.get('/search/skills/:query', function(req, res) {
    var params = sanitize(req.params);
    var query = params.query;
    query = query.replace(/[!@#$<>%^*()]/g, "");
    SettingsController.getSkills(function(err, skills) {
      if (err) {
        res.sendStatus(500);
      }
      var results = [];
      var i = 0;
      while (i < skills.length) {
        const skill = skills[i];
        if (skill.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
          results.push({
            "name": skill,
            "id": skill
          });
        }
        if (results.length > 50) {
          break;
        }
        i++;
      }
      if (results.length === 0) {
        results.push({
          "name": query,
          "id": query
        });
      }

      var data = {
        "results": results
      };

      return res.json(data);
    });
  });

  // ---------------------------------------------
  // Users
  // ---------------------------------------------

  /**
   * [ADMIN ONLY]
   *
   * GET - Get all users, or a page at a time.
   * ex. Paginate with ?page=0&size=100
   */
  router.get('/users', isAdminOrVolunteer, function(req, res){
    var query = req.query;
    if (query.page && query.size && query.sortBy && query.sortDir){
      UserController.getPage(query, defaultResponse(req, res));
    } else {
      UserController.getAll(defaultResponse(req, res));
    }
  });

  /**
   * [ADMIN ONLY]
   */
  router.get('/users/stats', isAdmin, function(req, res){
    UserController.getStats(defaultResponse(req, res));
  });

  router.post('/users/massReject', isAdmin, function(req, res){
    UserController.massReject(defaultResponse(req, res));
  });

  router.get('/users/rejectionCount', isAdmin, function(req, res){
    UserController.getRejectionCount(defaultResponse(req, res));
  });

  router.post('/users/massRejectRest', isAdmin, function(req, res){
    UserController.massRejectRest(defaultResponse(req, res));
  });

  router.get('/users/rejectionCountRest', isAdmin, function(req, res){
    UserController.getRejectionRestCount(defaultResponse(req, res));
  });

  router.get('/users/laterRejectCount', isAdmin, function(req, res) {
    UserController.getLaterRejectionCount(defaultResponse(req, res));
  })

  router.post('/users/sendResetEmail', isAdmin, function(req, res) {
    const email = req.body.email
    UserController.sendPasswordResetEmail(email, defaultResponse(req, res));
  })


  /**
   * [OWNER/ADMIN]
   *
   * GET - Get a specific user.
   */
  router.get('/users/:id', isOwnerOrAdmin, function(req, res){
    UserController.getById(req.params.id, defaultResponse(req, res));
  });

  /**
   * [OWNER/ADMIN]
   *
   * PUT - Update a specific user's profile.
   */

  router.put('/users/:id/profile', isOwnerOrAdmin, function(req, res){
    var profile = sanitize(req.body.profile);
    var special = req.body.special;
    var id = req.params.id;

    UserController.updateProfileById(id, profile, special, defaultResponse(req, res));
  });

  router.post('/users/:id/talentpool', isOwnerOrAdmin, function(req, res){
    var id = req.params.id;
    UserController.updateATalentInterest(id, defaultResponse(req, res));
  });

  router.put('/admin/users/:id/profile', isAdmin, function(req, res) {
    var profile = sanitize(req.body.profile);
    var special = req.body.special;
    var id = req.params.id;

    UserController.adminUpdateProfileById(id, profile, special, defaultResponse(req, res));
  })

  /**
   * [OWNER/ADMIN]
   *
   * PUT - Update a specific user's email.
   */

  router.put('/users/:id/email', isAdmin, function(req, res){
    var email = sanitize(req.body.email);
    var id = req.params.id;
    UserController.updateUserEmail(id, email, defaultResponse(req, res));
  });

  router.put('/users/:id/toggleSpecial', isAdmin, function(req, res){
    var id = req.params.id;
    var current = req.body.current
    UserController.toggleSpecial(id, current, defaultResponse(req, res));
  });

  router.post('/users/:id/changePassword', isAdmin, function(req, res){
    var id = req.params.id;
    var password = req.body.password;
    UserController.adminChangeUserPassword(id, password, defaultResponse(req, res));
  });

  /**
   * [OWNER/ADMIN]
   *
   * PUT - Update a specific user's matchmaking profile.
   */
  router.put('/users/:id/matchmaking', isOwnerOrAdmin, function(req, res){
    var profile = sanitize(req.body.profile);
    var id = req.params.id;

    UserController.updateMatchmakingProfileById(id, profile , defaultResponse(req, res));
  });

  /* GET - Update enrolled teams table for enrolled individual */

  router.get('/matchmaking/data', function(req, res){
    var token = getToken(req);
    var query = req.query;

    UserController.getByToken(token, function(err, user){

      if (err) {
        return res.status(500).send(err);
      }

      if (user){
        
        return UserController.getMatchmaking(user, query, defaultResponse(req, res));
        
      }

      return res.status(401).send({
        message: 'Get outta here, punk!'
      });

    });
  })

  /* PUT - Exit matchmaking search as team / individual */

  router.put('/matchmaking/exitSearch', function(req, res){
    var token = getToken(req);
    UserController.getByToken(token, function(err, user){
      
            if (err) {
              return res.status(500).send(err);
            }
      
            if (user){
              if(user.teamMatchmaking.enrolled){
                return UserController.exitSearch(user, defaultResponse(req, res));
              }
            }
      
            return res.status(401).send({
              message: 'Get outta here, punk!'
            });
      
          });
  })

  /* GET - Get user's team status */

  router.get('/matchmaking/teamInSearch', function(req, res){
    var token = getToken(req);
    UserController.getByToken(token, function(err, user){
      
            if (err) {
              return res.status(500).send(err);
            }
      
            if (user){

              return UserController.teamInSearch(user, defaultResponse(req, res));
              
            }
      
            return res.status(401).send({
              message: 'Get outta here, punk!'
            });
      
          });
  })

  /**
   * [OWNER/ADMIN]
   *
   * PUT - Update a specific user's confirmation information.
   */
  router.put('/users/:id/confirm', isOwnerOrAdmin, function(req, res){
    var confirmation = sanitize(req.body.confirmation);
    var id = req.params.id;

    UserController.updateConfirmationById(id, confirmation, defaultResponse(req, res));
  });

  router.put('/users/:id/reimbursement', isOwnerOrAdmin, function(req, res){
    var reimbursement = sanitize(req.body.reimbursement);
    var id = req.params.id;

    UserController.updateReimbursementById(id, reimbursement, defaultResponse(req, res));
  });

  /**
   * [OWNER/ADMIN]
   *
   * POST - Decline an acceptance.
   */
  router.post('/users/:id/decline', isOwnerOrAdmin, function(req, res){
    var confirmation = req.body.confirmation;
    var id = req.params.id;

    UserController.declineById(id, defaultResponse(req, res));
  });
  /**
   * Get user's team information. 
   */
  router.get('/users/:id/team/info', isOwnerOrAdmin, function(req, res) {
    const id = req.params.id
    UserController.getTeamInfo(id, defaultResponse(req, res))
  })
  /**
   * Get a user's team member's names. Uses the code associated
   * with the user making the request.
   */
  router.get('/users/:id/team', isOwnerOrAdmin, function(req, res){
    const id = req.params.id;
    UserController.getTeammates(id, defaultResponse(req, res));
  });

  /**
   * Update a teamcode. Join a team here.
   * {
   *   code: STRING
   * }
   */
  router.put('/users/:id/team/join', isOwnerOrAdmin, function(req, res){
    const code = sanitize(req.body.code);
    const id = req.params.id;
    UserController.joinTeam(id, code, defaultResponse(req, res));
  });
  /**
   * Create a new team
   */
  router.put('/users/:id/team/create', isOwnerOrAdmin, function(req, res){
    const id = req.params.id;
    UserController.createTeam(id, defaultResponse(req, res));
  });
  /** 
   * Lock a team
  */
  router.put('/users/:id/team/lock', isOwnerOrAdmin, function(req, res){
    console.log(req.body.teamInterests)
    const {teamInterests} = req.body
    const {id} = req.params
    UserController.lockTeam(id, teamInterests, defaultResponse(req, res))
  })
  /**
   * Kick a user from team
   */
  router.delete('/users/:id/team/kick/:userID', isOwnerOrAdmin, function(req, res) {
    const {id, userID} = req.params
    UserController.kickFromTeam(id, userID, defaultResponse(req, res))
  })
  /**
   * Remove a user from a team.
   */
  router.delete('/users/:id/team', isOwnerOrAdmin, function(req, res){
    var id = req.params.id;

    UserController.leaveTeam(id, defaultResponse(req, res));
  });

  /**
   * Update a user's password.
   * {
   *   oldPassword: STRING,
   *   newPassword: STRING
   * }
   */
  router.put('/users/:id/password', isOwnerOrAdmin, function(req, res){
    return res.status(304).send();
    // Currently disable.
    // var id = req.params.id;
    // var old = req.body.oldPassword;
    // var pass = req.body.newPassword;

    // UserController.changePassword(id, old, pass, function(err, user){
    //   if (err || !user){
    //     return res.status(400).send(err);
    //   }
    //   return res.json(user);
    // });
  });

  /**
   * Soft admit a user. ADMIN ONLY
   */

  router.post('/users/:id/softAdmit', isAdmin, function(req, res){
    // Accept the hacker. Admin only
    var id = req.params.id;
    var alreadyAdmitted = req.body.alreadyAdmitted;
    var user = req.user;
    UserController.softAdmitUser(id, user, alreadyAdmitted, defaultResponse(req, res));
  });

  router.post('/users/:id/acceptTravelClass', isAdmin, function(req, res){
    // Accept the Travel Grant class for a user
    var id = req.params.id;
    var reimbClass = req.body.reimbClass;
    UserController.acceptTravelClass(id, reimbClass, defaultResponse(req, res));
  })

  /**
   * Admit a user. ADMIN ONLY, DUH
   *
   * Also attaches the user who did the admitting, for liabaility.
   */
  router.post('/users/:id/admit', isAdmin, function(req, res){
    // Accept the hacker. Admin only
    var id = req.params.id;
    var user = req.user;
    UserController.admitUser(id, user, defaultResponse(req, res));
  });

  router.post('/users/:id/acceptTerminal', isAdmin, function(req, res){
    // Accept the hacker. Admin only
    var id = req.params.id;
    var user = req.user;
    UserController.acceptTerminal(id, defaultResponse(req, res));
  });

  /**
   * [ADMIN]
   *
   * POST - Rate participant.
   */
  router.post('/users/:id/rate', isAdmin, function(req, res){
    const rating = req.body.rating;
    const id = req.params.id;

    UserController.rateById(id, rating, defaultResponse(req, res));
  });

  /**
   * [ADMIN]
   *
   * POST - Reject participant.
   */
  router.post('/users/:id/reject', isAdmin, function(req, res){
    var confirmation = req.body.confirmation;
    var id = req.params.id;

    UserController.rejectById(id, defaultResponse(req, res));
  });

   /**
   * [ADMIN]
   *
   * POST - Unreject participant.
   */
  router.post('/users/:id/unreject', isAdmin, function(req, res){
    var confirmation = req.body.confirmation;
    var id = req.params.id;

    UserController.unRejectById(id, defaultResponse(req, res));
  });

  /**
   * Check in a user. ADMIN ONLY, DUH
   */
  router.post('/users/:id/checkin', isAdminOrVolunteer, function(req, res){
    var id = req.params.id;
    var user = req.user;
    UserController.checkInById(id, user, defaultResponse(req, res));
  });

  /**
   * Check in user with QR code. VOLUNTEER OR ADMIN
   */

  router.post('/users/:id/qrcheck', isAdminOrVolunteer,function(req, res){
    var id = sanitize(req.params.id);
    UserController.QRcheckInById(id, defaultResponse(req, res));
  });


  /**
   * Check in a user. ADMIN ONLY, DUH
   */
  router.post('/users/:id/checkout', isAdminOrVolunteer, function(req, res){
    var id = req.params.id;
    var user = req.user;
    UserController.checkOutById(id, user, defaultResponse(req, res));
  });

   /**
   * Send emails to unsubmitted applicants
   */
  router.post('/users/sendlagemails', isAdmin, function(req, res){
    UserController.sendEmailsToNonCompleteProfiles(defaultResponse(req, res));
  });

  /**
  * Send emails to rejected applicants
  */
  router.post('/users/:id/rejectEmail', isAdmin, function(req, res){
    var id = req.params.id
    UserController.sendRejectEmailByID(id, defaultResponse(req, res));
  });

 router.post('/users/sendRejectEmails', isAdmin, function(req, res){
   UserController.sendRejectEmails(defaultResponse(req, res));
 });

 router.post('/users/sendRejectEmailsRest', isAdmin, function(req, res){
  UserController.sendRejectEmailsRest(defaultResponse(req, res));
});

 /** 
  * Send QR emails to confirmed applicants
 */

 /*router.post('/users/sendQREmails', isAdmin, function(req, res){
  UserController.sendQREmails(defaultResponse(req, res));
});*/


  // ---------------------------------------------
  // Settings [ADMIN ONLY!]
  // ---------------------------------------------

  /**
   * Get the public settings.
   * res: {
   *   timeOpen: Number,
   *   timeClose: Number,
   *   timeToConfirm: Number,
   *   acceptanceText: String,
   *   confirmationText: String
   * }
   */
  router.get('/settings', function(req, res){
    SettingsController.getPublicSettings(defaultResponse(req, res));
  });

  /**
   * Update the acceptance text.
   * body: {
   *   text: String
   * }
   */
  router.put('/settings/waitlist', isAdmin, function(req, res){
    var text = req.body.text;
    SettingsController.updateField('waitlistText', text, defaultResponse(req, res));
  });

  /**
   * Update the acceptance text.
   * body: {
   *   text: String
   * }
   */
  router.put('/settings/acceptance', isAdmin, function(req, res){
    var text = req.body.text;
    SettingsController.updateField('acceptanceText', text, defaultResponse(req, res));
  });

  router.put('/settings/addschool', function(req, res){
    var body = sanitize(req.body);
    var school = body.school;
    if (!school) {
      res.sendStatus(400, "School is null");
    }
    else {
      school = school.replace(/[!@#$<>%^*()]/g, "");
      SettingsController.addSchool(school, defaultResponse(req, res));
    }
  });

  router.put('/settings/addskill', function(req, res){
    const body = sanitize(req.body);
    var skill = body.skill;
    if (!skill) {
      res.sendStatus(400, "Skill is null");
    }
    else{
      skill = skill.replace(/[!@#$<>%^*()]/g, "");
      SettingsController.addSkill(skill, defaultResponse(req, res));
    }
  });

  /**
   * Update the confirmation text.
   * body: {
   *   text: String
   * }
   */
  router.put('/settings/confirmation', isAdmin, function(req, res){
    var text = req.body.text;
    SettingsController.updateField('confirmationText', text, defaultResponse(req, res));
  });

  /**
   * Update the confirmation date.
   * body: {
   *   time: Number
   * }
   */
  router.put('/settings/confirm-by', isAdmin, function(req, res){
    var time = req.body.time;
    SettingsController.updateField('timeConfirm', time, defaultResponse(req, res));
  });

  router.put('/settings/update-confirm-by', isAdmin, function(req, res) {
    var special = req.body.special;
    UserController.updateConfirmByForAll(special, defaultResponse(req,res))
  })

    /**
   * Update the special confirmation date.
   * body: {
   *   time: Number
   * }
   */
  router.put('/settings/special-confirm-by', isAdmin, function(req, res){
    var time = req.body.time;
    SettingsController.updateField('timeConfirmSpecial', time, defaultResponse(req, res));
  });

    /**
   * Update the TR date.
   * body: {
   *   time: Number
   * }
   */
  router.put('/settings/tr-by', isAdmin, function(req, res){
    var time = req.body.time;
    SettingsController.updateField('timeTR', time, defaultResponse(req, res));
  });

      /**
   * Set not accepted and not rejected people on waitlist.
   * body: {
   *   time: Number
   * }
   */
  router.put('/settings/setOnWaitlist', isAdmin, function(req, res){
    UserController.setOnWailist(defaultResponse(req, res));
  });


  /**
   * Set the registration open and close times.
   * body : {
   *   timeOpen: Number,
   *   timeClose: Number
   * }
   */
  router.put('/settings/times', isAdmin, function(req, res){
    var open = req.body.timeOpen;
    var close = req.body.timeClose;
    var special = req.body.timeCloseSpecial;
    console.log(special)
    SettingsController.updateRegistrationTimes(open, close, special, defaultResponse(req, res));
  });

  /**
   * Get the whitelisted emails.
   *
   * res: {
   *   emails: [String]
   * }
   */
  router.get('/settings/whitelist', isAdmin, function(req, res){
    SettingsController.getWhitelistedEmails(defaultResponse(req, res));
  });

  /**
   * [ADMIN ONLY]
   * {
   *   emails: [String]
   * }
   * res: Settings
   *
   */
  router.put('/settings/whitelist', isAdmin, function(req, res){
    var emails = req.body.emails;
    SettingsController.updateWhitelistedEmails(emails, defaultResponse(req, res));
  });

  /**
   * [ADMIN ONLY]
   * {
   *   reimbClasses: Object
   * }
   * res: Settings
   *
   */
  router.put('/settings/reimbClasses', isAdmin, function(req, res){
    var reimbClasses = req.body.reimbClasses;
    SettingsController.updateReimbClasses(reimbClasses, defaultResponse(req, res));
  });

  /**
   * [ADMIN ONLY]
   * {
   *   showRejection: Boolean
   * }
   * res: Settings
   *
   */
  router.put('/settings/showRejection', isAdmin, function(req, res){
    var showRejection = req.body.showRejection;
    SettingsController.showRejection(showRejection, defaultResponse(req, res));
  });
};
