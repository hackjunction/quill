angular.module('reg')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'settings',
    'Session',
    'UserService',
    'SettingsService',
    function($scope, $rootScope, $state, $http, currentUser, Settings, Session, UserService, SettingsService){
      $scope.isDisabled = false;

      // Set up the user
      $scope.user = currentUser.data;
      $scope.schools = Settings.data.schools;
      if ($scope.user.profile.school == null) {
          $scope.schoolChecked = false;
      } else {
        $scope.schoolChecked = true;
      }
      var originalTeamCode = $scope.user.teamCode;

      // Populate the school dropdown
      _setupForm();

      $scope.regIsClosed = Date.now() > Settings.data.timeClose;

      $scope.addLanguage = function addLanguage() {
        $scope.user.profile.programmingLanguages.push({
          name: "",
          level: ""
        });
      };

      if ($scope.user.profile.programmingLanguages.length === 0) {
        $scope.addLanguage();
        setTimeout(function () {
          $('.ui.level.dropdown').dropdown('refresh');
        }, 1);
      }

      function _updateUser(e){
        // Update user profile
        UserService
          .updateProfile(Session.getUserId(), $scope.user.profile)
          .success(function(data){
            sweetAlert({
              title: "Awesome!",
              text: "Your application has been saved.",
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

      function _updateTeam(e) {
        // Update user teamCode
        if ($scope.user.teamCode === originalTeamCode || !$scope.user.teamCode) {
          return;
        }

        UserService
          .joinOrCreateTeam($scope.user.teamCode)
          .success(function(user){
            return;
          })
          .error(function(res){
            return;
          });
      }

      function _updateSchools(e) {
        if ($.inArray($scope.user.profile.school, $scope.schools) == -1) {
          SettingsService.addSchool($scope.user.profile.school)
          .success(function(user){
            return;
          })
          .error(function(res){
            console.log("Failed to add new school");
          });
        }
      }

      function _setupForm(){
        // Semantic-UI form validation
        $('.ui.form').form({
          inline:true,
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                }
              ]
            },
            age: {
              identifier: 'age',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your age.'
                },
                {
                  type: 'integer[13..120]',
                  prompt: 'You must be at least 13 to attend.'
                }
              ]
            },
            travelFromCountry: {
              identifier: 'travelFromCountry',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the country you are travelling from.'
                }
              ]
            },
            travelFromCity: {
              identifier: 'travelFromCity',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the city you are travelling from.'
                }
              ]
            },
            homeCountry: {
              identifier: 'homeCountry',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your home country.'
                }
              ]
            },
            mostInterestingTrack: {
              identifier: 'mostInterestingTrack',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the most interesting track for you.'
                }
              ]
            },
            occupationalStatus: {
              identifier: 'occupationalStatus',
              rules: [
                {
                  type: 'maxCount[2]',
                  prompt: 'Please select at most 2.'
                }
              ]
            },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender.'
                }
              ]
            },
            conduct: {
              identifier: 'conduct',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must accept MLH code of conduct to continue.'
                }
              ]
            },
            termsAndCond: {
              identifier: 'termsAndCond',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must accept Junction Terms & Conditions.'
                }
              ]
            }
          },
          onSuccess: function(event, fields){
            _updateTeam();
            _updateSchools();
            _updateUser();

          },
          onFailure: function(formErrors, fields){
            $scope.fieldErrors = formErrors;
            $scope.error = 'There were errors in your application. Please check that you filled all required fields.';
          }
        });

        // Set selected multiselect items
        $("#spacesOrTabs").dropdown('set selected', $scope.user.profile.spacesOrTabs);
        $("#operatingSystem").dropdown('set selected', $scope.user.profile.operatingSystem);
        $("#jobOpportunities").dropdown('set selected', $scope.user.profile.jobOpportunities);
        $("#description").dropdown('set selected', $scope.user.profile.description);
        $("#howManyHackathons").dropdown('set selected', $scope.user.profile.howManyHackathons);
        $("#codingExperience").dropdown('set selected', $scope.user.profile.codingExperience);
        $("#mostInterestingTrack").dropdown('set selected', $scope.user.profile.mostInterestingTrack);
        $("#gender").dropdown('set selected', $scope.user.profile.gender);
        $("#homeCountry").dropdown('set selected', $scope.user.profile.homeCountry);
        $("#travelFromCountry").dropdown('set selected', $scope.user.profile.travelFromCountry);
        $("#occupationalStatus").dropdown('set selected', $scope.user.profile.occupationalStatus);
        $("#degree").dropdown('set selected', $scope.user.profile.degree);

        $("#bestTools").dropdown('set selected', $scope.user.profile.bestTools);
        $("#previousJunction").dropdown('set selected', $scope.user.profile.previousJunction);
        $('.ui.dropdown').dropdown('refresh');

        setTimeout(function () {
          $("#school").dropdown('set selected', $scope.user.profile.school);
        }, 1);
      }

      $scope.submitForm = function(){
        if ($scope.user.profile.school === null && $scope.schoolChecked) {
          var schoolValue = $('#school').dropdown('get value');
          if (typeof schoolValue === 'object') {
            schoolValue = schoolValue[0]
          }
          schoolValue = schoolValue.replace("string:", "");
          $scope.user.profile.school = schoolValue;
        }
        if (!$scope.schoolChecked) {
          $scope.user.profile.school = null;
        }
        $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form').form('validate form');
      };
}]);
