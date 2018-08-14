angular.module('reg')
  .controller('TeamCtrl', [
    '$scope',
    'currentUser',
    'settings',
    'Utils',
    'UserService',
    'TEAM',
    function($scope, currentUser, settings, Utils, UserService, TEAM){

      //icon tooltip popup
      $('.icon')
      .popup({
        on: 'hover'
      });

      // Get the current user's most recent data.
      var Settings = settings.data;

      $scope.regIsOpen = true; // Don't change, at least yet.

      $scope.user = currentUser.data;

      $scope.TEAM = TEAM;

     function _populateTeammates(){
       UserService
         .getMyTeammates()
         .success(function(users){
           $scope.error = null;
           $scope.teammates = users;
         });
     }


      if ($scope.user.teamName){
        _populateTeammates();
      }

      $scope.joinTeam = function(){
        UserService
          .joinOrCreateTeam($scope.code)
          .success(function(user){
            $scope.error = null;
            $scope.user = user;
            _populateTeammates();
          })
          .error(function(res){
            $scope.error = res.message;
          });
      };

      $scope.leaveTeam = function(){
        UserService
          .leaveTeam()
          .success(function(user){
            $scope.error = null;
            $scope.user = user;
            $scope.teammates = [];
          })
          .error(function(res){
            $scope.error = res.data.message;
          });
      };

    }]);
