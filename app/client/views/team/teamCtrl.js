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
          })
          .error(function(res){
            $scope.error = res.message;
          });
      }
      function _getTeamInfo(){
        UserService
          .getTeamInfo()
          .success(function(team) {
            $scope.teamLeader = team.team.leader;
            $scope.teamLocked = team.team.teamLocked;
          })
          .error(function(res){
            $scope.error = res.message;
          });
      }
      if ($scope.user.team){
        _populateTeammates();
        _getTeamInfo();
      }

      $scope.joinTeam = function(){
        UserService
          .joinTeam($scope.code)
          .success(function(user){
            $scope.error = null;
            $scope.user = user;
            _populateTeammates();
            _getTeamInfo();
          })
          .error(function(res){
            $scope.error = res.message;
          });
      };

      $scope.createTeam = function() {
        UserService
          .createTeam()
          .success(function(user) {
            $scope.error = null;
            $scope.user = user;
            _populateTeammates();
            _getTeamInfo();
          })
          .error(function(res){
            $scope.error = res.message;
          });
      }

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
