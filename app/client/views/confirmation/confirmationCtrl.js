angular.module('reg')
  .controller('ConfirmationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    'currentUser',
    'Utils',
    'UserService',
    'SettingsService',
    function($scope, $rootScope, $state, currentUser, Utils, UserService, SettingsService){

      // Set up the user
      var user = currentUser.data;
      $scope.user = user;
      $scope.user.confirmation.phone = $scope.user.confirmation.phone ? `+${user.confirmation.phone}` : '';

      $scope.pastConfirmation = Date.now() > user.status.confirmBy;

      $scope.formatTime = Utils.formatTime;

      $scope.classAmount;

      SettingsService
        .getPublicSettings()
        .success(function(settings){
          getClassAmount(settings);
        });
      _setupForm();

      $('.icon')
      .popup({
        on: 'hover'
      });


      // -------------------------------
      // All this just for dietary restriction checkboxes fml

      var dietaryRestrictions = {
        'Vegetarian': false,
        'Vegan': false,
        'Halal': false,
        'Kosher': false,
        'Nut Allergy': false,
        'Gluten Free':false,
      };

      if (user.confirmation.dietaryRestrictions){
        user.confirmation.dietaryRestrictions.forEach(function(restriction){
          if (restriction in dietaryRestrictions){
            dietaryRestrictions[restriction] = true;
          }
        });
      }

      $scope.dietaryRestrictions = dietaryRestrictions;

      // -------------------------------

      function _getTeamInfo(){
        UserService
          .getTeamInfo()
          .success(function(team) {
            $scope.teamLeader = team.leader;
            $scope.user.confirmation.firstPriorityTrack = team.firstPriorityTrack;
            $scope.user.confirmation.secondPriorityTrack = team.secondPriorityTrack;
            $scope.user.confirmation.thirdPriorityTrack = team.thirdPriorityTrack;
            _setupForm();
          })
          .error(function(res){
            $scope.error = res.message;
          });
      }
      if ($scope.user.team){
        _getTeamInfo();
      }

      function _updateUser(e){
        var confirmation = $scope.user.confirmation;
        confirmation.phone = confirmation.phone.substring(1);
        // Get the dietary restrictions as an array
        var drs = [];
        Object.keys($scope.dietaryRestrictions).forEach(function(key){
          if ($scope.dietaryRestrictions[key]){
            drs.push(key);
          }
        });
        confirmation.dietaryRestrictions = drs;

        UserService
          .updateConfirmation(user._id, confirmation)
          .success(function(data){
            sweetAlert({
              title: "Woo!",
              text: "You're confirmed!",
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

      function _setupForm(){
        // Semantic-UI form validation
        var priorityRules = []
        if ($scope.teamLeader == $scope.user.id) {
          priorityRules = [{
            type: 'empty',
            prompt: 'As a team leader you have to pick a track for this priority!'
          }]
        }
        $('.ui.form').form({
          inline:true,
          fields: {
            shirt: {
              identifier: 'shirt',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please give us a shirt size!'
                }
              ]
            },
            phone: {
              identifier: 'phone',
              rules: [{
                  type: 'regExp[/^$|^[+][0-9]{0,20}$/]',
                  prompt: "Please give your phone number with country code in format: +NUMBER You can also leave phone number blank"
                  }
              ]
            },
            firstPrio: {
              identifier: 'firstPrioTrack',
              rules: priorityRules
            },
            secondPrio: {
              identifier: 'secondPrioTrack',
              rules: priorityRules
            },
            thirdPrio: {
              identifier: 'thirdPrioTrack',
              rules: priorityRules
            }
            },
            onSuccess: function(event, fields){
            _updateUser();

            $("#firstPrioTrack").dropdown('set selected', $scope.user.confirmation.firstPriorityTrack);
            $("#secondPrioTrack").dropdown('set selected', $scope.user.confirmation.secondPriorityTrack);
            $("#thirdPrioTrack").dropdown('set selected', $scope.user.confirmation.thirdPriorityTrack);
          },
          onFailure: function(formErrors, fields){
            $scope.fieldErrors = formErrors;
            $scope.error = 'There were errors in your application. Please check that you filled all required fields.';

        }
        });
      }

      function getClassAmount(settings) {
        switch($scope.user.profile.AcceptedreimbursementClass){
          case("Finland"):
            $scope.classAmount = settings.reimbursementClass.Finland;
            break;
          case("Baltics"):
            $scope.classAmount = settings.reimbursementClass.Baltics;
            break;
          case("Nordic"):
            $scope.classAmount = settings.reimbursementClass.Nordics;
            break;
          case("Europe"):
            $scope.classAmount = settings.reimbursementClass.Europe;
            break;
          case("Rest of the World"):
            $scope.classAmount = settings.reimbursementClass.RestOfTheWorld;
            break;
          case("Golden Ticket"):
            $scope.classAmount = settings.reimbursementClass.GoldenTicket;
            break;
          case("Rejected"):
            $scope.classAmount = "Rejected";
            break;
          default:
            $scope.classAmount = $scope.user.profile.AcceptedreimbursementClass;
        }
      }

      $scope.submitForm = function(){
         $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form').form('validate form');
      };

    }]);
