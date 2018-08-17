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
      $scope.fieldErrors = undefined
      $scope.error = undefined
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
            console.log(team)
            $scope.teamLeader = team.leader;
            $scope.teamLocked = team.teamLocked;
            $scope.teamInterests = team.trackInterests;
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
            $("#teamInterests").dropdown('set selected', "");
          })
          .error(function(res){
            $scope.error = res.data.message;
          });
      };

      $scope.lockTeam = function(){
        if($('#lockingForm').form('is valid')){
          $scope.error = null
          $scope.fieldErrors = null
          swal({
            title: "Are you sure?",
            text: "Do you have all members in the team?\n This will lock in your team, new members won't be able to join the team anymore after it is locked.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, lock the team.",
            closeOnConfirm: true
            }, function(){
              UserService
                .lockTeam($scope.teamInterests)
                .success(function(team) {
                  $scope.teamLocked = team.teamLocked
                })
                .error(function(res){
                  $scope.error = res.data.message;
                });
          })
        } else {
          $('#lockingForm').form('validate form')
        }
      }

      $scope.kickFromTeam = function(user){
        swal({
          title: "Are you sure?",
          text: `Do you want to kick ${user.profile.name} from your team?`,
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, I'm sure.",
          closeOnConfirm: true
          }, function(){
            UserService
              .kickFromTeam(user.id)
              .success(function(team) {
                _populateTeammates()
              })
              .error(function(res){
                $scope.error = res.data.message;
              });
        });
      }

      function _setupForm() {
        $('#lockingForm')
        .form({
          fields: {
            teamInterests:  {
              identifier: 'teamInterests',
              rules: [
                {
                  type: 'maxCount[3]',
                  prompt: 'You can select max 3 tracks!'
                },
                {
                  type: 'empty',
                  prompt: 'Please select at least one track'
                }
              ]
            }
          },
          onFailure: function(formErrors, fields){
            $scope.fieldErrors = formErrors;
            $scope.error = 'There is error in the field above!';
          }
        })
        $("#teamInterests").dropdown('set selected', $scope.teamInterests);
      }

      _setupForm()
    }]);
