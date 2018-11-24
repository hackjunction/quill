require('dotenv').load();
var mongoose        = require('mongoose');
var database        = process.env.MONGO_URL ||  "mongodb://localhost:27017";
var fetch = require('node-fetch');
mongoose.connect(database);

const User = require('../app/server/models/User');
const Team = require('../app/server/models/Team');
const UserController = require('../app/server/controllers/UserController');

Team.find({}, function(err, teams){
  if(err || !teams){
    console.log("no teams")
    return;
  }
  let team = teams[400]
  teams.forEach(function(team){
    if(!team.gavelId){
      console.log("no gavelId")
      return;
    }
    User.find({team: team._id}, function(err, users){
      let teamData = users.map(function(user){
        return {
          email: user.email,
          _id: user.gavel.id,
          name: user.profile.name
        }
      })
      const body = JSON.stringify({
        'key': process.env.GAVEL_API_KEY,
        'members': teamData
      });
      fetch(
        `${process.env.GAVEL_URL}/api/external/teams/update-members/${team.gavelId}`,
        {
          method: 'POST',
          //body: params
          body: body,
          headers: { 'Content-Type': 'application/json' },
        }
      )
      .then(function(res) {
        //console.log(res)
        if (!res.ok){
          return Promise.reject({
            "message": res.statusText
          })
        }
        return res;
      })
      .then(function(res) {
        return res.json()
      })
      .then(function(res) {
        return res.data
      })
      .then(function(gavelMembers){
        //console.log("gavelMembers", gavelMembers)
        users.forEach(function(teamMember){
          //console.log(teamMember)
          gavelTeamMember = gavelMembers.filter(function(gavelMember){return gavelMember.email === teamMember.email})[0]
          console.log(gavelTeamMember)
          teamMember.gavel.id = gavelTeamMember._id;
          teamMember.gavel.token = gavelTeamMember.secret;
          teamMember.save(function(err){
            if(err) console.log(err)
          })
        })
      }).catch(function(err){
        console.log(err)
      })
    })
  })
});
