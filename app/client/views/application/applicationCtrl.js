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
      if ($scope.user.profile.school) {
        $('#goesToSchool').prop('checked', true)
        $scope.goesToSchool = true
        $scope.goesNotToSchool = false 
      } else if($scope.user.profile.oldDegree) {
        $('#goesNotToSchool').prop('checked', true)
        $scope.goesNotToSchool = true
        $scope.goesToSchool = false
        $scope.oldDegreeChecked = true
      }

      $scope.setSchool = function(setting) {
        console.log(setting)
        if(setting === "yes") {
          $scope.goesToSchool = true
          $scope.goesNotToSchool = false
        } else {
          $scope.goesToSchool = false
          $scope.goesNotToSchool = true
        }
      }
      var originalTeamCode = $scope.user.teamCode;

      //icon tooltip popup
      $('.icon')
      .popup({
        on: 'hover'
      });

      var languages = ['AngularJS', 'Assembly', 'Bash', 'C', 'C#', 'C++', 'Clojure',
                       'CoffeeScript', 'CSS', 'Excel', 'Go', 'Groovy', 'Haskell', 'HTML',
                       'Java', 'JavaScript', 'Kotlin', 'Lua', 'Matlab', 'Node.js',
                       'Objective-C', 'Perl', 'PHP', 'PowerPoint', 'Python', 'Qt', 'R', 'React',
                       'Ruby', 'Scala', 'SQL', 'Swift', 'TypeScript', 'VBA', 'VB.NET',
                       'Visual Basic 6', '.NET Core', 'Other'];
      $scope.programmingLanguages = languages;
      // Populate the school dropdown
      _setupForm();

      $scope.regIsClosed = Date.now() > Settings.data.timeClose || $scope.user.status.admitted;

      var reimbClasses;
      $.getJSON('../assets/reimbClasses.json').done(function(data){
              reimbClasses = data;
      });

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
      $scope.getReimbursementClass = function(homeCountry) {
        // User needs reimbursement
        if($scope.user.profile.needsReimbursement) {
          $scope.user.profile.AppliedreimbursementClass = reimbClasses[homeCountry].Class;
          }
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
        if (Settings.data.schools.indexOf($scope.user.profile.school) === -1 && $scope.user.profile.school !== null) {
          SettingsService.addSchool($scope.user.profile.school)
          .success(function(user){
            console.log('Yeet')
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
                  type: 'integer[13..1000]',
                  prompt: 'You must be at least 13 to attend.'
                },
                {
                  type: 'integer[0..99]',
                  prompt: 'You must be under 100 years old to attend.'
                }
              ]
            },
            school: {
              identifier: 'school',
              depends: 'hasSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school.'
                }
              ]
            },
            graduationYear: {
              identifier: 'graduationYear',
              depends: 'hasSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your graduationYear.'
                },
                {
                  type: 'integer[2017..2040]',
                  prompt: 'Your graduation year should be something sensible.'
                },
              ]
            },
            degree: {
              identifier: 'degree',
              depends: 'hasSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your degree.'
                }
              ]
            },
            major: {
              identifier: 'major',
              depends: 'hasSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your major.'
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
            jobOpportunities: {
              identifier: 'jobOpportunities',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select if you are interested in job opportunities.'
                }
              ]
            },
            codingExperience: {
              identifier: 'codingExperience',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your coding experience.'
                }
              ]
            },
            bestTools: {
              identifier: 'bestTools',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your best tools.'
                }
              ]
            },
            howManyHackathons: {
              identifier: 'howManyHackathons',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select how many hackathons you have attended.'
                }
              ]
            },
            description: {
              identifier: 'description',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your role in a hackathon team.'
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
                },
                {
                type: 'empty',
                prompt: 'Please select your occupational status.'
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
        console.log($scope.user)
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
        $("#workingLanguages").dropdown('set selected', $scope.user.profile.workingLanguages);
        $("#previousJunction").dropdown('set selected', $scope.user.profile.previousJunction);
        $(".oldDegree").dropdown('set selected', $scope.user.profile.oldDegree ? $scope.user.profile.oldDegree.degree : "");
        $('.ui.dropdown').dropdown('refresh');

        setTimeout(function () {
          $(".ui.language").dropdown('set selected', $scope.user.profile.workingLanguages);
          $(".ui.school").dropdown('set selected', $scope.user.profile.school);
          $(".ui.toptools.dropdown").dropdown('set selected', $scope.user.profile.topLevelTools);

          $("#greatLevelTools").dropdown('set selected', $scope.user.profile.greatLevelTools);
          $("#goodLevelTools").dropdown('set selected', $scope.user.profile.goodLevelTools);
          $("#beginnerLevelTools").dropdown('set selected', $scope.user.profile.beginnerLevelTools);

          if ($scope.regIsClosed) {
            $('.ui.dropdown').addClass("disabled");
          }

        }, 1);
      }

      $scope.submitForm = function(){
        if ($scope.goesToSchool) {
          $scope.user.profile.oldDegree = null
        }
        else if ($scope.goesNotToSchool) {
          $scope.user.profile.school = null;
          $scope.user.profile.graduationYear = null;
          $scope.user.profile.degree = null;
          $scope.user.profile.major = null;
        }
        $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form').form('validate form');
      };
}])
.filter('exclude', function () {
  return function (items, languages, dropdownIdentifier) {

    var selectedLanguages = [];
    selectedLanguages.push($(".ui.toptools.dropdown").dropdown('get value'));
    selectedLanguages.push($(".ui.greattools.dropdown").dropdown('get value'));
    selectedLanguages.push($(".ui.goodtools.dropdown").dropdown('get value'));
    selectedLanguages.push($(".ui.beginnerTools.dropdown").dropdown('get value'));
    selectedLanguages = [].concat.apply([], selectedLanguages);
    // Strip the unnecessary 'string:' substring
    selectedLanguages = stripLanguageSubstrings(selectedLanguages);
    var callerLanguages = $(dropdownIdentifier).dropdown('get value');
    callerLanguages = [].concat.apply([], callerLanguages);
    callerLanguages = stripLanguageSubstrings(callerLanguages);

    // Finally, remove the selected languages from dropdown options
    var remaining = languages.filter( function( el ) {
      return !selectedLanguages.includes( el ) || callerLanguages.includes(el);
    } );
    return remaining;
  };
});

function findSelectedValues() {
  return selectedLanguages;
}

function stripLanguageSubstrings(langs) {
  langs.forEach(function(part, index, theArray) {
    theArray[index] = theArray[index].replace("string:", "");
  });

  return langs;
}
