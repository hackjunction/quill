angular.module('reg')
  .directive('fileInput', ['$parse', function($parse){
    return {
      restrict: 'A',
      link:function(scope,elm,attrs){
        elm.bind('change',function(){
          $parse(attrs.fileInput)
          .assign(scope,elm[0].files)
          scope.$apply()
        })
      }
    }
  }]);


angular.module('reg')
  .controller('ReimbursementCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'settings',
    'Session',
    'UserService',
    function($scope, $rootScope, $state, $http, currentUser, Settings, Session, UserService){

      // Set up the user
      $scope.user = currentUser.data;
      $scope.generalCheck = $scope.user.status.reimbursementApplied;
      $scope.user.reimbursement.dateOfBirth = new Date($scope.user.reimbursement.dateOfBirth);
      $scope.pastTRDeadline = (Date.now() > Settings.data.timeTR);
      $scope.fileSelected = false;
      $scope.isSEPA = false;
      $scope.isUS = false;
      $scope.isRUS = false;
      $scope.isINDIA = false;
      $scope.isAUS = false;
      $scope.isOther = false;

      $('input[type=radio][name=accountOwner]').change(function() {
        if($(this).val() == 'user'){
          $('.ACNAME').attr('disabled', true);
          $('.ACBD').attr('disabled', true);
          $('.ACAL1').attr('disabled', true);
          $('.ACAL2').attr('disabled', true);
          $('.ACCITY').attr('disabled', true);
          $('.ACZIP').attr('disabled', true);
          $('.ACREG').attr('disabled', true);
          $('.ACCOUNTRY').attr('disabled', true);
        }
        else{
          $('.ACNAME').attr('disabled', false);
          $('.ACBD').attr('disabled', false);
          $('.ACAL1').attr('disabled', false);
          $('.ACAL2').attr('disabled', false);
          $('.ACCITY').attr('disabled', false);
          $('.ACZIP').attr('disabled', false);
          $('.ACREG').attr('disabled', false);
          $('.ACCOUNTRY').attr('disabled', false);
        }
      });

      $scope.upload = function() {
        var fd = new FormData()
        angular.forEach($scope.files,function(file){
          fd.append('file',file)
        });

        if($scope.files){
          $('.loader').attr('class', $('.loader').attr('class') + ' active');
          $http.post('/api/upload/' + $scope.fileName, fd,
          {
            transformRequest:angular.identity,
            headers:{'Content-Type':undefined}
          })
          .success(function(data) {
            $scope.user.reimbursement.fileName = $scope.fileName;
            $scope.user.reimbursement.fileUploaded = true;
            checkCountryType();
            $('.loader').attr('class', 'ui inline loader');
            swal("Success!", "Your file has been uploaded to our servers.")
          })
          .error(function() {
            $('.loader').attr('class', 'ui inline loader');
            swal("Error!", "Your file is not in the right format or is too large.")
          });
        }
      }

      //var ibanCountries;
      $.getJSON('../assets/iban.json')
        .done(function(data){
            $scope.ibanCountries = data;
            checkCountryType();
            _setupForm();
        })
        .fail(function(data){
            console.log( "Error loading iban.json" );
        });

      $scope.onBankCountryUpdate = function() {

          //When the Country of Bank field gets changed,
          //look through what is the type of the country
          //and set the state of disabled attribute based on that
          if($('#countryOfB').val() != ''){
            checkCountryType();
          }
      };

      $scope.updateFileName = function() {
          //When a new file is chosen, update the file name for the user in the scope
          if(!$scope.fileSelected){
            $scope.fileSelected = true;
            checkCountryType();
          }
          var strings = $('#fileName').val().split('\\');
          var fileName = strings[strings.length - 1];
          $scope.fileName = fileName;
      }

      /*$('.dateOfBirth').change(function() {
        if($scope.user.reimbursement.dateOfBirth !== 'undefined'){
          if(('.dateOfBirth').val() !== 'undefined'){
          $scope.disableUpload = false;
          var offset = $scope.dateOfBirth.getTimezoneOffset();
          var dateWithOffset = new Date($scope.dateOfBirth.getTime() - offset*60*1000);    
          $scope.user.reimbursement.dateOfBirth = dateWithOffset;
          }
        }
        else{
          $scope.disableUpload = true;
        }
      });*/

      $('.icon')
      .popup({
        on: 'hover'
      });

      /**
       * TODO: JANK WARNING
       */


      function _updateUser(e){
        // Update user profile
        UserService
          .updateReimbursement(Session.getUserId(), $scope.user.reimbursement)
          .success(function(data){
            sweetAlert({
              title: "Awesome!",
              text: "Your travel reimbursement has been saved.",
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

      function getIBANLength(){
        var country = $('#countryOfB').val();

        //here we get the length for the iban field validation

        if($scope.ibanCountries === undefined){
          if(country != undefined){
            return 10;
          }
          return 100;
        }
        else{
          var result = $scope.ibanCountries.filter(function(obj) {
            return obj.country === country;
          });

          if(result.length > 0){
            return result[0].ibanLength
          }

          return 25;
        }
      }

      function checkCountryType(){

        var disabledToggler = false;

        var filteredCountry = $scope.ibanCountries.filter(function(obj) {
          return obj.country === $('#countryOfB').val();
        });
        //filteredCountry is an array of one so we take the first element and check the type
        var countryType = "NotDefined"
        if(filteredCountry[0] != undefined){
          countryType = filteredCountry[0].countryType;
        }

        if(countryType === "SEPA" || countryType === "ibanAndBic" || countryType === "onlyIban"){
          //disable the fields that are not needed before they are hidden with ng-show
          $('.ibanField').attr('disabled', disabledToggler);
          $('.accountNumberField').attr('disabled', !disabledToggler);
          $('.addressOfBankField').attr('disabled', !disabledToggler);
          $('.bbanField').attr('disabled', !disabledToggler);
          $('.rcpField').attr('disabled', !disabledToggler);
          $('.clearingCodeField').attr('disabled', !disabledToggler);
          $('.cityOfBankField').attr('disabled', !disabledToggler);
          $('.zipCodeBankField').attr('disabled', !disabledToggler);
          $('.brokerageInfoField').attr('disabled', !disabledToggler);

          //some of the countries need more specific label for the fields, and here we set them back to general or make them more specific
          $('.bbanLabel').html('BBAN (Basic bank account number)')
          $('.swiftBicLabel').html('SWIFT / BIC');
          $('.ccLabel').html('Clearing code');

          //setting the filter elements true or false to show the right fields for the different country types
          $scope.isSEPA = true;
          $scope.isUS = false;
          $scope.isINDIA = false;
          $scope.isRUS = false;
          $scope.isOther = false;
          $scope.isAUS = false;
        }

        else if(countryType === "ibanOrOther" || countryType === "NotDefined"){
          $('.ibanField').attr('disabled', !disabledToggler);
          $('.accountNumberField').attr('disabled', disabledToggler);
          $('.addressOfBankField').attr('disabled', disabledToggler);
          $('.bbanField').attr('disabled', !disabledToggler);
          $('.rcpField').attr('disabled', !disabledToggler);
          $('.clearingCodeField').attr('disabled', disabledToggler);
          $('.cityOfBankField').attr('disabled', disabledToggler);
          $('.zipCodeBankField').attr('disabled', disabledToggler);
          $('.brokerageInfoField').attr('disabled', disabledToggler);

          $('.bbanLabel').html('BBAN (Basic bank account number)')
          $('.swiftBicLabel').html('SWIFT / BIC');
          $('.ccLabel').html('Clearing code');

          $scope.isSEPA = false;
          $scope.isUS = false;
          $scope.isINDIA = false;
          $scope.isRUS = false;
          $scope.isOther = true;
          $scope.isAUS = false;
        }
        else if(countryType === "US"){
          $('.ibanField').attr('disabled', !disabledToggler);
          $('.accountNumberField').attr('disabled', !disabledToggler);
          $('.addressOfBankField').attr('disabled', disabledToggler);
          $('.clearingCodeField').attr('disabled', disabledToggler);
          $('.bbanField').attr('disabled', disabledToggler);
          $('.rcpField').attr('disabled', !disabledToggler);
          $('.cityOfBankField').attr('disabled', disabledToggler);
          $('.zipCodeBankField').attr('disabled', disabledToggler);
          $('.brokerageInfoField').attr('disabled', disabledToggler);

          $('.bbanLabel').html('BBAN (Basic bank account number)')
          $('.swiftBicLabel').html('SWIFT / BIC');
          $('.ccLabel').html('Clearing code')

          $scope.isSEPA = false;
          $scope.isUS = true;
          $scope.isINDIA = false;
          $scope.isRUS = false;
          $scope.isOther = false;
          $scope.isAUS = false;
        }
        else if(countryType === "IND"){
          $('.ibanField').attr('disabled', !disabledToggler);
          $('.accountNumberField').attr('disabled', !disabledToggler);
          $('.addressOfBankField').attr('disabled', !disabledToggler);
          $('.clearingCodeField').attr('disabled', disabledToggler);
          $('.bbanField').attr('disabled', disabledToggler);
          $('.rcpField').attr('disabled', disabledToggler);
          $('.cityOfBankField').attr('disabled', !disabledToggler);
          $('.zipCodeBankField').attr('disabled', !disabledToggler);
          $('.brokerageInfoField').attr('disabled', !disabledToggler);

          $('.bbanLabel').html('BBAN (Basic bank account number)')
          $('.swiftBicLabel').html('SWIFT / BIC');
          $('.ccLabel').html('Clearing code (IFSC)');

          $scope.isSEPA = false;
          $scope.isUS = false;
          $scope.isINDIA = true;
          $scope.isRUS = false;
          $scope.isOther = false;
          $scope.isAUS = false;
        }
        else if(countryType === "RUS"){
          $('.ibanField').attr('disabled', !disabledToggler);
          $('.accountNumberField').attr('disabled', !disabledToggler);
          $('.addressOfBankField').attr('disabled', disabledToggler);
          $('.clearingCodeField').attr('disabled', !disabledToggler);
          $('.bbanField').attr('disabled', disabledToggler);
          $('.rcpField').attr('disabled', !disabledToggler);
          $('.cityOfBankField').attr('disabled', disabledToggler);
          $('.zipCodeBankField').attr('disabled', disabledToggler);
          $('.brokerageInfoField').attr('disabled', disabledToggler);

          $('.bbanLabel').html('BBAN (Basic bank account number - Must be <b>EURO</b> account)')
          $('.swiftBicLabel').html('BIC');
          $('.ccLabel').html('Clearing code');

          $scope.isSEPA = false;
          $scope.isUS = false;
          $scope.isINDIA = false;
          $scope.isRUS = true;
          $scope.isOther = false;
          $scope.isAUS = false;
        }
        else if(countryType === "AUS"){
          $('.ibanField').attr('disabled', !disabledToggler);
          $('.accountNumberField').attr('disabled', !disabledToggler);
          $('.addressOfBankField').attr('disabled', disabledToggler);
          $('.clearingCodeField').attr('disabled', disabledToggler);
          $('.bbanField').attr('disabled', disabledToggler);
          $('.rcpField').attr('disabled', !disabledToggler);
          $('.cityOfBankField').attr('disabled', disabledToggler);
          $('.zipCodeBankField').attr('disabled', disabledToggler);
          $('.brokerageInfoField').attr('disabled', disabledToggler);

          $('.bbanLabel').html('BBAN (Basic bank account number)')
          $('.swiftBicLabel').html('SWIFT / BIC');
          $('.ccLabel').html('Clearing code (BSB - Bank/State/Branch)')

          $scope.isSEPA = false;
          $scope.isUS = false;
          $scope.isINDIA = false;
          $scope.isRUS = false;
          $scope.isOther = false;
          $scope.isAUS = true;
        }

        //here the form gets destroed and set up again so that it can be validated again

        $('.ui.form').form('destroy');

        _setupForm(countryType);
      }

      function _setupForm(countryType){
        // Semantic-UI form validation
        var val = getIBANLength();

        var iban = {
          identifier: 'iban',
          rules: [
            {
              type: 'empty',
              prompt: 'Please enter your IBAN.'
            },
            {
              type: 'exactLength[' + val + ']',
              prompt: 'Your IBAN has to be {ruleValue} characters long'
            }
          ]
        };

        var swiftOrBic = {
          identifier: 'swiftOrBic',
          rules: [
            {
              type: 'empty',
              prompt: 'Please enter your SWIFT or BIC.'
            }
          ]
        };

        var clearingCode = {
          identifier: 'clearingCode',
          rules: [
            {
              type: 'empty',
              prompt: 'Please enter the clearing code.'
            }
          ]
        };

        var addressOfBank = {
          identifier: 'addressOfBank',
          rules: [
            {
              type: 'empty',
              prompt: 'Please enter the address of your bank.'
            }
          ]
        };
        var cityOfBank =  {
          identifier: 'cityOfBank',
          rules: [
            {
              type: 'empty',
              prompt: 'Please enter the city of your bank.'
            }
          ]
        };

        var zipCodeBank = {
          identifier: 'zipCodeBank',
          rules: [
            {
              type: 'empty',
              prompt: 'Please enter ZIP Code of your bank.'
            }
          ]
        };

        var brokerageInfo = {
          identifier: 'brokerageInfo',
          rules: [
            {
              type: 'maxLength[50]',
              prompt: 'This field can only be 50 characters long.'
            }
          ]
        };

        var fileUpload = {
          identifier: 'fileUpload',
          rules: [
            {
              type: 'empty',
              prompt: 'Please select a file to upload'
            }
          ]
        };

        if($scope.fileSelected){
          fileUpload.rules = [
          {
            type: 'exactLength[100]',
            prompt: "Please upload the file you've selected"
          }
          ];
        }
        if($scope.user.reimbursement.fileUploaded){
          fileUpload.rules = [];
        }

        if(countryType === "ibanOrOther" || countryType === "onlyIban" || countryType === "NotDefined" || countryType === "AUS" || countryType === "IND"){

          swiftOrBic.rules = [];

          iban.rules = [
            {
              type: 'maxLength[' + val +']',
              prompt: 'Your IBAN can be max. {ruleValue} characters long'
            }
          ]
        }

        if(countryType === "RUS"){
          addressOfBank.rules = [];
          cityOfBank.rules = [];
          zipCodeBank.rules = [];
          brokerageInfo.rules = [];
        }

        if(countryType === "US"){
          clearingCode.rules = [
            {
              type: 'empty',
              prompt: 'Please enter the clearing code.'
            },
            {
              type: 'exactLength[9]',
              prompt: 'Your clearing code must be 9 characters long.'
            }
          ]
        }

        $('.ui.form').form({
          inline:true,
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
                  type: 'empty',
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
            city: {
              identifier: 'city',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the city you live in.'
                }
              ]
            },
            zipCode: {
              identifier: 'zipCode',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your ZIP Code.'
                }
              ]
            },
            nationality: {
              identifier: 'nationality',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your nationality.'
                }
              ]
            },
            countryOfLiving: {
              identifier: 'countryOfLiving',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your country of living.'
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

            //account owner information validation

            accountOwnerCheck: {
              identifier: 'ownerCheck',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select one of the options about the owner of the bank account.'
                }
              ]
            },

            accountOwnerName: {
              identifier: 'ACNAME',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's full name."
                }
              ]
            },
            accountOwnerBirthdate: {
              identifier: 'ACBD',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's birthdate."
                }
              ]
            },
            accountOwnerA1: {
              identifier: 'ACAL1',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's address line 1."
                }
              ]
            },
            accountOwnerA2: {
              identifier: 'ACAL2',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's address line 2."
                }
              ]
            },
            accountOwnerCity: {
              identifier: 'ACCITY',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's city."
                }
              ]
            },
            accountOwnerZIP: {
              identifier: 'ACZIP',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's zip code."
                }
              ]
            },
            accountOwnerRegion: {
              identifier: 'ACREG',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's state/province/region."
                }
              ]
            },
            accountOwnerName: {
              identifier: 'ACCOUNTRY',
              rules: [
                {
                  type: 'empty',
                  prompt: "Please enter the account onwer's country."
                }
              ]
            },
            //account validation
            nameOfBank: {
              identifier: 'nameOfBank',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the name of your bank.'
                }
              ]
            },
            swiftOrBic: swiftOrBic,
            clearingCode: clearingCode,
            iban: iban,
            accountNumber: {
              identifier: 'accountNumber',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your Account number.'
                }
              ]
            },
            bban: {
              identifier: 'bban',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your BBAN.'
                }
              ]
            },
            addressOfBank: addressOfBank,
            cityOfBank: cityOfBank,
            zipCodeBank: zipCodeBank,
            brokerageInfo: brokerageInfo,
            fileUpload: fileUpload,
            receiptPurposeCode: {
              identifier: 'rcpField',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the Receipt purpose code.'
                },
                {
                  type: 'exactLength[5]',
                  prompt: 'Receipt purpose code must be 5 characters long.'
                }
              ]
            },
            correctInfo: {
              identifier: 'correctInfo',
              rules: [
                {
                  type: 'checked',
                  prompt: "Please indicate that you've double checked your information!"
                }
              ]
            }
          },
          onSuccess: function(event, fields){
            _updateUser();
          },
          onFailure: function(formErrors, fields){
            $scope.fieldErrors = formErrors;
            $scope.error = 'There were errors in your application. Please check that you filled all required fields.';
          }
        });
      }

      $scope.submitForm = function(){
        $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form').form('validate form');
      };

    }]);
