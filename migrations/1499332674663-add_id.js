'use strict';
var User = require('../app/server/models/User');

var programmingLanguages = require('../app/server/assets/programming_languages.json');

function generateID(){
    var l = programmingLanguages.length;
    return programmingLanguages[Math.floor(Math.random() * l)] +
            programmingLanguages[Math.floor(Math.random() * l)] +
            programmingLanguages[Math.floor(Math.random() * l)];
}


/**
 * Make any changes you need to make to the database here
 */
exports.up = function up (done) {
  this('User').find(function(error, users){
    console.log(error, users)
    users.forEach(function(user){
      user.id = generateID();
      user.save();
    })
  });
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down(done) {
  this('User').update({}, {$unset: {id: 1 }}, function(){

  });
  done();
};
