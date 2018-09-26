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

      $('.icon')
      .popup({
        on: 'hover'
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
            $('.loader').attr('class', 'ui inline loader');
            swal("Success!", "Your file has been uploaded to our servers.")
          })
          .error(function() {
            $('.loader').attr('class', 'ui inline loader');
            swal("Error!", "Your file is not in the right format or is too large.")
          });
        }
      }

      $scope.updateFileName = function() {
        //When a new file is chosen, update the file name for the user in the scope
        if(!$scope.fileSelected){
          $scope.fileSelected = true;
        }
        var strings = $('#fileName').val().split('\\');
        var fileName = strings[strings.length - 1];
        $scope.fileName = fileName;
      }


      function _updateUser(e){
        // Update user profile
        UserService
          .updateReimbursement(Session.getUserId(), $scope.user.reimbursement)
          .success(function(data){
            sweetAlert({
              title: "Awesome!",
              text: "Your travel grant application has been saved.",
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

        $('.ui.form').form({
          inline:true,
          fields: {
            fileUpload: fileUpload,
            correctInfo: {
              identifier: 'correctInfo',
              rules: [
                {
                  type: 'checked',
                  prompt: "Please indicate that you've double checked your information!"
                }
              ]
            },
            paypal: {
              identifier: 'paypal',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your PayPal email address'
                },
                {
                  type: 'maxLength[100]',
                  prompt: 'The email can be only max. 100 characters!'
                }
              ]
            },
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
            ssn: {
              identifier: 'socialsn',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your social security number.'
                },
                {
                  type: 'maxLength[60]',
                  prompt: 'The SSN can be only max. 60 characters!'
                }
              ]
            },
            totalSum: {
              identifier: 'totalSum',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the total sum of receipts.'
                },
                {
                  type: 'maxLength[60]',
                  prompt: "The total sum can be max 60 characters!"
                }
              ]
            },
            addressLine1: {
              identifier: 'addressLine1',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your street address.'
                },
                {
                  type: 'maxLength[60]',
                  prompt: 'The address can be only max. 60 characters!'
                }
              ]
            },
            addressLine2: {
              identifier: 'addressLine2',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter information about your apartment.'
                },
                {
                  type: 'maxLength[60]',
                  prompt: 'The address can be only max. 60 characters!'
                }
              ]
            },
            city: {
              identifier: 'city',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter the city you live in.'
                },
                {
                  type: 'maxLength[60]',
                  prompt: 'The city can be only max. 60 characters!'
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
            homeCountry: {
              identifier: 'homeCountry',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your home country.'
                }
              ]
            },
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
        _setupForm();
        $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form').form('validate form');
      };

      _setupForm();

    }]);
