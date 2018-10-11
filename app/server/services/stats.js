var _ = require('underscore');
var async = require('async');
var User = require('../models/User');
var Settings = require('../models/Settings')

// In memory stats.
var stats = {};
function calculateStats(settings){
  console.log('Calculating stats...');
  var newStats = {
    lastUpdated: 0,

    total: 0,
    demo: {
      gender: {
        M: 0,
        F: 0,
        O: 0,
        N: 0
      },
      tracks: {
        'HealthTech': 0,
        'Logistics': 0,
        'Entertainment': 0,
        'Mobility': 0,
        'Intelligent Buildings': 0,
        'Game Jam': 0,
        'FinTech': 0,
        'Industrial Internet': 0,
        'Artificial Intelligence': 0,
        'Big Data': 0
      },
      schools: {},
      // year: {
      //   '2016': 0,
      //   '2017': 0,
      //   '2018': 0,
      //   '2019': 0,
      // }
    },

    teams: {
      alone: 0,
      teamOrAlone:0,
      onlyTeam: 0
    },
    verified: 0,
    submitted: 0,
    rated: 0,
    rated5Stars: 0,
    rated4Stars: 0,
    rated3Stars: 0,
    rated2Stars: 0,
    rated1Stars: 0,
    softAdmitted: 0,
    admitted: 0,
    confirmed: 0,
    confirmedMit: 0,
    declined: 0,
    specialReg: 0,

    confirmedFemale: 0,
    confirmedMale: 0,
    confirmedOther: 0,
    confirmedNone: 0,

    shirtSizes: {
      'XS': 0,
      'S': 0,
      'M': 0,
      'L': 0,
      'XL': 0,
      'XXL': 0,
      'WXS': 0,
      'WS': 0,
      'WM': 0,
      'WL': 0,
      'WXL': 0,
      'WXXL': 0,
      'None': 0
    },

    dietaryRestrictions: {},

    hostNeededFri: 0,
    hostNeededSat: 0,
    hostNeededUnique: 0,

    hostNeededFemale: 0,
    hostNeededMale: 0,
    hostNeededOther: 0,
    hostNeededNone: 0,

    reimbursementTotal: 0,
    reimbursementMissing: 0,

    wantsHardware: 0,

    checkedIn: 0,

    RfinlandTotal: 0,
    RbalticsTotal: 0,
    RnordicTotal:  0,
    ReuropeTotal:  0,
    RoutsideTotal: 0,

    AfinlandTotal: 0,
    AbalticsTotal: 0,
    AnordicTotal:  0,
    AeuropeTotal:  0,
    AoutsideTotal: 0,
    Aspecial:      0,
    ArejectedTotal:0,

    CfinlandTotal: 0,
    CbalticsTotal: 0,
    CnordicTotal:  0,
    CeuropeTotal:  0,
    CoutsideTotal: 0,
    Cspecial:      0,
    CrejectedTotal:0,

    TotalAmountofReimbursementsAccepted: 0,
    TotalAmountofReimbursementsConfirmed: 0,

    appliedStats: {
      tracks: {
        'HealthTech': 0,
        'Logistics': 0,
        'Entertainment': 0,
        'Mobility': 0,
        'Intelligent Buildings': 0,
        'Game Jam': 0,
        'FinTech': 0,
        'Industrial Internet': 0,
        'Artificial Intelligence': 0,
        'Big Data': 0
      }
    },

    admittedStats: {
      tracks: {
        'HealthTech': 0,
        'Logistics': 0,
        'Entertainment': 0,
        'Mobility': 0,
        'Intelligent Buildings': 0,
        'Game Jam': 0,
        'FinTech': 0,
        'Industrial Internet': 0,
        'Artificial Intelligence': 0,
        'Big Data': 0
      }
    },

    confirmedStats: {
      tracks: {
        'HealthTech': 0,
        'Logistics': 0,
        'Entertainment': 0,
        'Mobility': 0,
        'Intelligent Buildings': 0,
        'Game Jam': 0,
        'FinTech': 0,
        'Industrial Internet': 0,
        'Artificial Intelligence': 0,
        'Big Data': 0
      }
    }
  };



  User
    .find({})
    .exec(function(err, users){
      if (err || !users){
        throw err;
      }

      newStats.total = users.length;

      async.each(users, function(user, callback){

        // Grab the email extension
        var email = user.email.split('@')[1];

        // Add to the gender
        newStats.demo.gender[user.profile.gender] += 1;

        // Add to tracks
        if(user.status.completedProfile && !user.status.admitted && !user.status.confirmed){
          newStats.appliedStats.tracks[user.profile.mostInterestingTrack] += 1;
        }
        if(user.status.admitted  && user.status.completedProfile && !user.status.confirmed){
          newStats.admittedStats.tracks[user.profile.mostInterestingTrack] += 1;
        }
        if(user.status.confirmed){
          newStats.confirmedStats.tracks[user.profile.mostInterestingTrack] += 1;
        }
        newStats.demo.tracks[user.profile.mostInterestingTrack] += 1;

        // Count verified
        newStats.verified += user.verified ? 1 : 0;

        // Count submitted
        newStats.submitted += user.status.completedProfile ? 1 : 0;

        // Count rated
        newStats.rated += user.status.rating > 0 ? 1 : 0;

        // Count rated 5 stars
        newStats.rated5Stars += user.status.rating == 5 ? 1 : 0;

        // Count rated 4 stars
        newStats.rated4Stars += user.status.rating == 4 ? 1 : 0;

        // Count rated 3 stars
        newStats.rated3Stars += user.status.rating == 3 ? 1 : 0;

        // Count rated 2 stars
        newStats.rated2Stars += user.status.rating == 2 ? 1 : 0;

        // Count rated 1 stars
        newStats.rated1Stars += user.status.rating == 1 ? 1 : 0;

        // Count individuals
        newStats.teams.alone += user.profile.teamSelection === 'alone' ? 1 : 0;

        // Count applying as individuals or team
        newStats.teams.teamOrAlone += user.profile.teamSelection === 'teamOrAlone' ? 1 : 0;

        // Count teams
        newStats.teams.onlyTeam += user.profile.teamSelection === 'onlyTeam' ? 1 : 0;

        // Count accepted
        newStats.softAdmitted += user.status.softAdmitted ? 1 : 0;

        // Count accepted
        newStats.admitted += user.status.admitted ? 1 : 0;

        // Count confirmed
        newStats.confirmed += user.status.confirmed ? 1 : 0;

        // Count confirmed that are mit
        newStats.confirmedMit += user.status.confirmed && email === "mit.edu" ? 1 : 0;

        newStats.confirmedFemale += user.status.confirmed && user.profile.gender == "F" ? 1 : 0;
        newStats.confirmedMale += user.status.confirmed && user.profile.gender == "M" ? 1 : 0;
        newStats.confirmedOther += user.status.confirmed && user.profile.gender == "O" ? 1 : 0;
        newStats.confirmedNone += user.status.confirmed && user.profile.gender == "N" ? 1 : 0;

        // Count declined
        newStats.declined += user.status.declined ? 1 : 0;

        newStats.specialReg += user.specialRegistration ? 1 : 0;

        // Count the number of people who need reimbursements
        // newStats.reimbursementTotal += user.confirmation.needsReimbursement ? 1 : 0;
        newStats.reimbursementTotal += user.profile.needsReimbursement ? 1 : 0;

        // Count the number of requested travel reimbursement clasess
        newStats.RfinlandTotal += user.profile.AppliedreimbursementClass == "Finland" ? 1 : 0;
        newStats.RbalticsTotal += user.profile.AppliedreimbursementClass == "Baltics" ? 1 : 0;
        newStats.RnordicTotal += user.profile.AppliedreimbursementClass == "Nordics" ? 1 : 0;
        newStats.ReuropeTotal += user.profile.AppliedreimbursementClass == "Europe" ? 1 : 0;
        newStats.RoutsideTotal += user.profile.AppliedreimbursementClass == "Rest of the World" ? 1 : 0;

        if(!user.status.declined){
          var regex = /\d/g;
          if (user.profile.AcceptedreimbursementClass == "Finland") {
            if (user.status.confirmed) {
              newStats.CfinlandTotal += 1;
              newStats.TotalAmountofReimbursementsConfirmed += settings.reimbursementClass.Finland;
            }
            newStats.AfinlandTotal += 1;
            newStats.TotalAmountofReimbursementsAccepted += settings.reimbursementClass.Finland;
          } else if (user.profile.AcceptedreimbursementClass == "Baltics") {
            if (user.status.confirmed) {
              newStats.CbalticsTotal += 1;
              newStats.TotalAmountofReimbursementsConfirmed += settings.reimbursementClass.Baltics;
            }
            newStats.AbalticsTotal += 1;
            newStats.TotalAmountofReimbursementsAccepted += settings.reimbursementClass.Baltics;
          } else if (user.profile.AcceptedreimbursementClass == "Nordics") {
            if (user.status.confirmed) {
              newStats.CnordicTotal += 1;
              newStats.TotalAmountofReimbursementsConfirmed += settings.reimbursementClass.Nordics;
            }
            newStats.AnordicTotal += 1;
            newStats.TotalAmountofReimbursementsAccepted += settings.reimbursementClass.Nordics;
          } else if (user.profile.AcceptedreimbursementClass == "Europe") {
            if (user.status.confirmed) {
              newStats.CeuropeTotal += 1;
              newStats.TotalAmountofReimbursementsConfirmed += settings.reimbursementClass.Europe;
            }
            newStats.AeuropeTotal += 1;
            newStats.TotalAmountofReimbursementsAccepted += settings.reimbursementClass.Europe;
          } else if (user.profile.AcceptedreimbursementClass == "Rest of the World") {
            if (user.status.confirmed) {
              newStats.CoutsideTotal += 1;
              newStats.TotalAmountofReimbursementsConfirmed += settings.reimbursementClass.RestOfTheWorld;
            }
            newStats.AoutsideTotal += 1;
            newStats.TotalAmountofReimbursementsAccepted += settings.reimbursementClass.RestOfTheWorld;
          } else if (user.profile.AcceptedreimbursementClass == "Golden Ticket") {
            if (user.status.confirmed) {
              newStats.Cspecial += 1;
              newStats.TotalAmountofReimbursementsConfirmed += settings.reimbursementClass.GoldenTicket;
            }
            newStats.Aspecial += 1;
            newStats.TotalAmountofReimbursementsAccepted += settings.reimbursementClass.GoldenTicket;
          } else if (user.profile.AcceptedreimbursementClass == "Rejected") {
            if (user.status.confirmed) {
              newStats.CrejectedTotal += 1;
            }
            newStats.ArejectedTotal += 1;
          }
        }
        // Count the number of people who still need to be reimbursed
        newStats.reimbursementMissing += user.confirmation.needsReimbursement &&
          !user.status.reimbursementGiven ? 1 : 0;

        // Count the number of people who want hardware
        newStats.wantsHardware += user.confirmation.wantsHardware ? 1 : 0;

        // Count schools
        if (!newStats.demo.schools[email]){
          newStats.demo.schools[email] = {
            submitted: 0,
            admitted: 0,
            confirmed: 0,
            declined: 0,
          };
        }
        newStats.demo.schools[email].submitted += user.status.completedProfile ? 1 : 0;
        newStats.demo.schools[email].admitted += user.status.admitted ? 1 : 0;
        newStats.demo.schools[email].confirmed += user.status.confirmed ? 1 : 0;
        newStats.demo.schools[email].declined += user.status.declined ? 1 : 0;

        // Count graduation years
        // if (user.profile.graduationYear){
        //   newStats.demo.year[user.profile.graduationYear] += 1;
        // }

        // Grab the team name if there is one
        // if (user.teamCode && user.teamCode.length > 0){
        //   if (!newStats.teams[user.teamCode]){
        //     newStats.teams[user.teamCode] = [];
        //   }
        //   newStats.teams[user.teamCode].push(user.profile.name);
        // }

        // Count shirt sizes
        if (user.confirmation.shirtSize in newStats.shirtSizes){
          newStats.shirtSizes[user.confirmation.shirtSize] += 1;
        }

        // Host needed counts
        newStats.hostNeededFri += user.confirmation.hostNeededFri ? 1 : 0;
        newStats.hostNeededSat += user.confirmation.hostNeededSat ? 1 : 0;
        newStats.hostNeededUnique += user.confirmation.hostNeededFri || user.confirmation.hostNeededSat ? 1 : 0;

        newStats.hostNeededFemale
          += (user.confirmation.hostNeededFri || user.confirmation.hostNeededSat) && user.profile.gender == "F" ? 1 : 0;
        newStats.hostNeededMale
          += (user.confirmation.hostNeededFri || user.confirmation.hostNeededSat) && user.profile.gender == "M" ? 1 : 0;
        newStats.hostNeededOther
          += (user.confirmation.hostNeededFri || user.confirmation.hostNeededSat) && user.profile.gender == "O" ? 1 : 0;
        newStats.hostNeededNone
          += (user.confirmation.hostNeededFri || user.confirmation.hostNeededSat) && user.profile.gender == "N" ? 1 : 0;

        // Dietary restrictions
        if (user.confirmation.dietaryRestrictions){
          user.confirmation.dietaryRestrictions.forEach(function(restriction){
            if (!newStats.dietaryRestrictions[restriction]){
              newStats.dietaryRestrictions[restriction] = 0;
            }
            newStats.dietaryRestrictions[restriction] += 1;
          });
        }

        // Count checked in
        newStats.checkedIn += user.status.checkedIn ? 1 : 0;

        callback(); // let async know we've finished
      }, function() {
        // Transform dietary restrictions into a series of objects
        var restrictions = [];
        _.keys(newStats.dietaryRestrictions)
          .forEach(function(key){
            restrictions.push({
              name: key,
              count: newStats.dietaryRestrictions[key],
            });
          });
        newStats.dietaryRestrictions = restrictions;

        // Transform schools into an array of objects
        var schools = [];
        _.keys(newStats.demo.schools)
          .forEach(function(key){
            schools.push({
              email: key,
              count: newStats.demo.schools[key].submitted,
              stats: newStats.demo.schools[key]
            });
          });
        newStats.demo.schools = schools;

        // Likewise, transform the teams into an array of objects
        // var teams = [];
        // _.keys(newStats.teams)
        //   .forEach(function(key){
        //     teams.push({
        //       name: key,
        //       users: newStats.teams[key]
        //     });
        //   });
        // newStats.teams = teams;

        console.log('Stats updated!');
        newStats.lastUpdated = new Date();
        stats = newStats;
      });
    });

}

setInterval(function() {
  Settings
    .getPublicSettings(function(err, settings){
       if (err || !settings){
        throw err;
      }
      calculateStats(settings);
  });
}, 600000);

setTimeout(function () {
    Settings
        .getPublicSettings(function(err, settings){
            if (err || !settings){
                throw err;
            }
            calculateStats(settings);
        });
}, 8000);

var Stats = {};

Stats.getUserStats = function(){
  return stats;
};

module.exports = Stats;
