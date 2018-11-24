require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.MONGO_URL || { url: "mongodb://localhost:27017"};
mongoose.connect(database.url);

const User = require('../app/server/models/User');
const Team = require('../app/server/models/Team');
const UserController = require('../app/server/controllers/UserController');

Team.find({}, function(err, teams){
  if(err || !teams){
    console.log("no teams")
    return;
  }
  teams.forEach(function(team){
    User.find({team: team._id}, function(err, users){
      if(err || !users) return;
      let uniqueIds = users.map(user => user.id)
      console.log(uniqueIds)
      team.members = uniqueIds;
      team.save(function(err){
        if(err)
          console.log("setting team members failed")
      })
    })
  })
});
