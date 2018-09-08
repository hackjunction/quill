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

      function _setupForm(){
        // Semantic-UI form validation
        

        

        

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
                  type: 'maxLength[30]',
                  prompt: 'The Merchant ID can be only max. 30 characters!'
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

      _setupForm();

    }]);
