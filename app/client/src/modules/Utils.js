angular.module('reg')
  .factory('Utils', [
    function(){
      return {
        isRegOpen: function(settings){
          return Date.now() > settings.timeOpen && Date.now() < settings.timeClose;
        },
        isAfter: function(time){
          return Date.now() > time;
        },
        formatTime: function(time){

          if (!time){
            return "Invalid Date";
          }

          date = new Date(time);
          // Hack for timezone
          return moment(date).format('dddd, MMMM Do YYYY, h:mm a') +
            " " + date.toTimeString().split(' ')[2];

        },
        getAcceptedreimbAmount: function(user, settings){
          switch(user.profile.AcceptedreimbursementClass){
            case("Finland"):
              return settings.reimbursementClass.Finland;
            case("Baltics"):
              return settings.reimbursementClass.Baltics;
            case("Nordic"):
              return settings.reimbursementClass.Nordic;
            case("Europe"):
              return settings.reimbursementClass.Europe;
            case("Outside Europe"):
              return settings.reimbursementClass.Outside;
            case("None"):
              return "0";
            default:
              return user.profile.AcceptedreimbursementClass;
          }
        }
      };
    }]);