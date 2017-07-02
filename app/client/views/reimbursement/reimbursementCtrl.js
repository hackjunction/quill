angular.module('reg')
  .controller('ReimbursementCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'Session',
    'UserService',
    function($scope, $rootScope, $state, $http, currentUser, Settings, Session, UserService){

      $scope.isDisabled = false;

      // Set up the user
      $scope.user = currentUser.data;
      // Populate the school dropdown
      _setupForm();

      checkSepa();





      function _setupForm(){
        // Semantic-UI form validation
        $('.ui.form').form({
          fields: {
            fullName: {
              identifier: 'fullName',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your full name.'
                }
              ]
            },
            dateOfBirth: {
              identifier: 'dateOfBirth',
              rules: [
                {
                  type: 'date',
                  prompt: 'Please enter your date of birth.'
                }
              ]
            },
            addressLine1: {
              identifier: 'addressLine1',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your street address.'
                }
              ]
            },
            addressLine2: {
              identifier: 'addressLine2',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter information about your apartment.'
                }
              ]
            },

            countryOfBank: {
              identifier: 'countryOfBank',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the country of your bank.'
                }
              ]
            },
            nameOfBank: {
              identifier: 'nameOfBank',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the name of your bank.'
                }
              ]
            },
            swiftOrBicOrClearingCode: {
              identifier: 'swiftOrBicOrClearingCode',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the SWIFT, BIC or Clearing code.'
                }
              ]
            },
            IBAN: {
              identifier: 'iban',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your IBAN.'
                }
              ]
            },
            accountNumber: {
              identifier: 'accountNumber',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your Account number.'
                }
              ]
            },
            addressOfBank: {
              identifier: 'addressOfBank',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the address of your bank.'
                }
              ]
            },
            zipCode: {
              identifier: 'zipCode',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter ZIP Code.'
                }
              ]
            },
            correspondentBank: {
              identifier: 'correspondentBank',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter Correspondent Bank.'
                }
              ]
            }
          }
        });
      }



      $scope.submitForm = function(){
        if ($('.ui.form').form('is valid')){
          _updateUser();
        }
      };

    }]);

    function checkSepa(){
      var SEPA = [
        "Netherlands",
        "Belgium",
        "Bulgaria",
        "Estonia",
        "Spain",
        "Ireland",
        "Great Britain",
        "Italy",
        "Austria",
        "Greece",
        "Croatia",
        "Cypros",
        "Latvia",
        "Lithuania",
        "Luxembourg",
        "Malta",
        "Portugal",
        "Poland",
        "France",
        "Romania",
        "Sweden",
        "Germany",
        "Slovakia",
        "Slovenia",
        "Finland",
        "Denmark",
        "Czech Republic",
        "Hungary",
        "Iceland",
        "Liechtenstein",
        "Norway",
        "Switzerland",
      ]
      $('#countryOfB').change(function() {
          var check_sepa = SEPA.includes($('#countryOfB').val());
          $('.notSepa').attr('disabled', check_sepa);
          $('.sepa').attr('disabled', !check_sepa);
      });
    }
