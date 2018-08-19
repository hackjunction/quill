angular.module('reg')
  .factory('SettingsService', [
  '$http',
  function($http){

    var base = '/api/settings/';

    return {
      getPublicSettings: function(){
        return $http.get(base);
      },
      updateRegistrationTimes: function(open, close){
        return $http.put(base + 'times', {
          timeOpen: open,
          timeClose: close,
        });
      },
      updateConfirmationTime: function(time){
        return $http.put(base + 'confirm-by', {
          time: time
        });
      },
      updateTRTime: function(time){
        return $http.put(base + 'tr-by', {
          time: time
        });
      },
      getWhitelistedEmails: function(){
        return $http.get(base + 'whitelist');
      },
      updateWhitelistedEmails: function(emails){
        return $http.put(base + 'whitelist', {
          emails: emails
        });
      },
      updateWaitlistText: function(text){
        return $http.put(base + 'waitlist', {
          text: text
        });
      },
      updateAcceptanceText: function(text){
        return $http.put(base + 'acceptance', {
          text: text
        });
      },
      addSchool: function(text){
        return $http.put(base + 'addschool', {
          school: text
        });
      },
      addSkill: function(text){
        return $http.put(base + 'addskill', {
          skill: text
        })
      },
      updateConfirmationText: function(text){
        return $http.put(base + 'confirmation', {
          text: text
        });
      },
      updateReimbClasses: function(reimbClasses){
        return $http.put(base + 'reimbClasses', {
          reimbClasses: reimbClasses
        });
      },
      showRejection: function(showRejection){
        return $http.put(base + 'showRejection', {
          showRejection: showRejection
        });
      }
    };

  }
  ]);
