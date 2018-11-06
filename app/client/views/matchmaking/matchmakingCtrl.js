angular.module('reg')
  .controller('MatchmakingCtrl', [
    '$state',
    '$scope',
    '$stateParams',
    'currentUser',
    'settings',
    'Utils',
    'UserService',
    'TEAM',
    'Session',
    function($state, $scope, $stateParams, currentUser, settings, Utils, UserService, TEAM, Session){

      //icon tooltip popup
      $('.icon')
      .popup({
        on: 'hover'
      });
      // Get the current user's most recent data.
      var Settings = settings.data;
      $scope.regIsOpen = Utils.isRegOpen(Settings);

      $scope.user = currentUser.data;
      _setupIndividualForm();
      _setupTeamForm();

      /*TABLE UPDATING
      $scope.params = [];
      $scope.users = [];

      function updateTable(data){
        $scope.users = data;
      }
      function getMatchMaking(){
        UserService
        .getMatchmaking()
        .success(function(data){
          updateTable(data);
        })
      }*/

      //Check if user's team already submitted the form
      $scope.teamSearching = false;
      

      //Individual can get the teams data
      /*if($scope.user.teamMatchmaking.enrollmentType === 'individual'){
        getMatchMaking();
      }*/

      if($scope.user.teamCode){
        UserService
        .getTeamSearching()
        .success(function(result){
          $scope.teamSearching = result;
        })
      }



      $scope.TEAM = TEAM;

      $scope.showIndividualForm = false;
      $scope.showTeamForm = false;
      $scope.showForms = true;

      $scope.submitIndividualForm = function(){
        $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form.individual').form('validate form');
        // getMatchMaking();
      };

      $scope.submitTeamForm = function(){
        $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form.team').form('validate form');
      };



      $scope.setIndividual = function(){
        console.log('Search as individual');
        $scope.showIndividualForm = true;
        $scope.showTeamForm = false;
      };

      $scope.setTeam = function(){
        console.log('Search as a team');
        $scope.showTeamForm = true;
        $scope.showIndividualForm = false;
      };

      $scope.exitSearch = function(){
        UserService
          .exitSearch()
          .success(function(data){
            sweetAlert({
            title: "Search Ended!",
            text: "You've ended the search for additional team members.",
            type: "success",
            confirmButtonColor: "#5ABECF"
            }, function(){
              $state.go('app.dashboard');
            });
            })
            .error(function(res){
              sweetAlert("Uh oh!", "Something went wrong.", "error");
            });
      }

      $scope.getBestCodingSkills = function(){
        var skills = "";
        var prf = currentUser.data.profile;
        
        function joinIfNotEmpty(arr){
          if (arr !== undefined && arr.length > 0) skills = arr.join(", ");
        };

        joinIfNotEmpty(prf.beginnerLevelTools);
        joinIfNotEmpty(prf.goodLevelTools);
        joinIfNotEmpty(prf.greatLevelTools);
        joinIfNotEmpty(prf.topLevelTools);
        
        return skills;
      };

      function _updateMatchmakingProfile() {
        UserService
        .updateMatchmakingProfile(Session.getUserId(), $scope.user.teamMatchmaking)
        .success(function(data){
          sweetAlert({
            title: "Awesome!",
            text: "You are now in listed in the team matchmaking system.",
            type: "success",
            confirmButtonColor: "#5ABECF"
          }, function(){
            //$state.go('app.dashboard');
            console.log('success');
          });
        })
        .error(function(res){
          sweetAlert("Uh oh!", "Something went wrong.", "error");
        });

      }

      function _setupIndividualForm(){
        // Semantic-UI form validation
        $('.ui.form.individual').form({
          inline:true,
          fields: {
            individual_slackHandle: {
              identifier: 'individual_slackHandle',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter a Slack handle.'
                }
              ]
            },
            individual_role: {
              identifier: 'individual_role',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a description for your role in a hackathon team.'
                }
              ]
            },
            individual_mostInterestingTrack: {
              identifier: 'individual_mostInterestingTrack',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the track you are most interested in.'
                }
              ]
            },
            individual_topChallenges: {
              identifier: 'individual_topChallenges',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select at least one challenge.'
                }
              ]
            },
          },
          onSuccess: function(event, fields){
            $scope.user.teamMatchmaking.enrolled = true;
            $scope.user.teamMatchmaking.enrollmentType = 'individual';
            _updateMatchmakingProfile();
          },
          onFailure: function(formErrors, fields){
            $scope.fieldErrors = formErrors;
            $scope.error = 'There were errors in your submission. Please check that you filled all required fields.';
          }
        });
        $("#individual_mostInterestingTrack").dropdown('set selected', $scope.user.teamMatchmaking.individual.mostInterestingTrack);
        $("#individual_topChallenges").dropdown('set selected', $scope.user.teamMatchmaking.individual.topChallenges);
        $("#individual_role").dropdown('set selected', $scope.user.teamMatchmaking.individual.role);
      }

      function _setupTeamForm(){
        // Semantic-UI form validation
        $('.ui.form.team').form({
          inline:true,
          fields: {
            team_slackHandle: {
              identifier: 'team_slackHandle',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter a Slack handle.'
                }
              ]
            },
            team_mostInterestingTrack: {
              identifier: 'team_mostInterestingTrack',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the track your team is most interested in.'
                }
              ]
            },
            team_roles: {
              identifier: 'team_roles',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please add at least one role that you need in your team.'
                }
              ]
            },
            team_topChallenges: {
              identifier: 'team_topChallenges',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please add at least one challenge your team is interested in.'
                }
              ]
            },
          },
          onSuccess: function(event, fields){
            $scope.user.teamMatchmaking.enrolled = true;
            $scope.user.teamMatchmaking.enrollmentType = 'team';
            _updateMatchmakingProfile();
          },
          onFailure: function(formErrors, fields){
            $scope.fieldErrors = formErrors;
            $scope.error = 'There were errors in your submission. Please check that you filled all required fields.';
          }
        });
        $("#team_mostInterestingTrack").dropdown('set selected', $scope.user.teamMatchmaking.team.mostInterestingTrack);
        $("#team_topChallenges").dropdown('set selected', $scope.user.teamMatchmaking.team.topChallenges);
        $("#team_roles").dropdown('set selected', $scope.user.teamMatchmaking.team.roles);
      }


    }]);
