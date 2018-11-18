angular.module('reg')
  .controller('DashboardCtrl', [
    '$rootScope',
    '$scope',
    '$sce',
    '$http',
    'currentUser',
    'settings',
    'Utils',
    'AuthService',
    'UserService',
    'EVENT_INFO',
    'DASHBOARD',
    function($rootScope, $scope, $sce, $http, currentUser, settings, Utils, AuthService, UserService, DASHBOARD){
      var Settings = settings.data;
      var user = currentUser.data;
      $scope.user = user;
      $scope.classAmount = Utils.getAcceptedreimbAmount(user, Settings);
      $scope.DASHBOARD = DASHBOARD;

      for (var msg in $scope.DASHBOARD) {
        if ($scope.DASHBOARD[msg].includes('[APP_DEADLINE]')) {
          $scope.DASHBOARD[msg] = $scope.DASHBOARD[msg].replace('[APP_DEADLINE]', Utils.formatTime(Settings.timeClose));
        }
        if ($scope.DASHBOARD[msg].includes('[CONFIRM_DEADLINE]')) {
          $scope.DASHBOARD[msg] = $scope.DASHBOARD[msg].replace('[CONFIRM_DEADLINE]', Utils.formatTime(user.status.confirmBy));
        }
      }

      //icon tooltip popup
      $('.icon')
      .popup({
        on: 'hover'
      });

      if(window.location.pathname === '/talentpool') {
        swal({
          title: "Hiya!",
          text: "Do you want to be added to the aTalent's talent pool? aTalent will reach out to you directly when positions matching your skills and interests arise!",
          confirmButtonColor: "#41e648",
          confirmButtonText: "Yes, add me!",
          }, function(){
            UserService
              .updateATalentInterest()
              .success(function(data){
                sweetAlert({
                  title: "Awesome!",
                  text: "You've been added to the talent pool!",
                  type: "success",
                  confirmButtonColor: "#5ABECF"
                }, function(){
                  $state.go('app.dashboard');
                })
              })
              .error(function(err) {
                sweetAlert({
                  title: "Uh oh!",
                  text: "Something went wrong.",
                  type: "error"
                })
              });
        });
      }

      // Is registration open?
      var regIsOpen = $scope.regIsOpen = Utils.isRegOpen(Settings);

      // Is it past the user's confirmation time?
      var pastConfirmation = $scope.pastConfirmation = Utils.isAfter(user.status.confirmBy);

      $scope.dashState = function(status){
        var user = $scope.user;

        switch (status) {
          case 'unverified':
            return !user.verified;
          case 'openAndIncomplete':
            return regIsOpen && user.verified && !user.status.completedProfile;
          case 'openAndSubmitted':
            return regIsOpen && user.status.completedProfile && !user.status.admitted &&
            !(user.status.rejected && Settings.showRejection);
          case 'closedAndIncomplete':
            return !regIsOpen && !user.status.completedProfile && !user.status.admitted &&
            !(user.status.rejected && Settings.showRejection);
          case 'closedAndSubmitted': // Waitlisted State
            return !regIsOpen && user.status.completedProfile && !user.status.admitted &&
            !(user.status.rejected && Settings.showRejection);
          case 'admittedAndCanConfirm':
            return !pastConfirmation &&
              user.status.admitted &&
              !user.status.confirmed &&
              !user.status.declined
          case 'admittedAndCannotConfirm':
            return pastConfirmation &&
              user.status.admitted &&
              !user.status.confirmed &&
              !user.status.declined;
          case 'confirmed':
            return user.status.admitted && user.status.confirmed && !user.status.declined;
          case 'declined':
            return user.status.declined;
          case 'reviewed':
            return user.status.rejected && Settings.showRejection;
        }
        return false;
      };

      $scope.showWaitlist = !regIsOpen && user.status.completedProfile && !user.status.admitted && !user.status.rejected;

      $scope.resendEmail = function(){
        AuthService
          .resendVerificationEmail()
          .then(function(){
            sweetAlert('Your email has been sent.');
          });
      };

      $scope.goToGavel = function(){
        UserService.goToGavel();
      }

      // -----------------------------------------------------
      // Text!
      // -----------------------------------------------------
      var converter = new showdown.Converter();
      $scope.acceptanceText = $sce.trustAsHtml(converter.makeHtml(Settings.acceptanceText));
      $scope.confirmationText = $sce.trustAsHtml(converter.makeHtml(Settings.confirmationText));
      $scope.waitlistText = $sce.trustAsHtml(converter.makeHtml(Settings.waitlistText));


      $scope.declineAdmission = function(){

        swal({
          title: "Whoa!",
          text: "Are you sure you would like to decline your admission? \n\n You can't go back!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, I can't make it.",
          closeOnConfirm: true
          }, function(){

            UserService
              .declineAdmission(user._id)
              .success(function(user){
                $rootScope.currentUser = user;
                $scope.user = user;
              });
        });
      };

      $scope.checkStatus = function() {
        if(user.status.rejected && Settings.showRejection){
          return 'Reviewed';
        }
        return user.status.name;
      };
      //QR
      /*$scope.getQRCode = function(id){
        if($scope.user.status.confirmed){
          $http.get('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + id)
          .then(function(response){
            console.log(response.data)
            document.getElementById('QRContainer').innerHTML = response.data;
          });
        }
      };*/

      $scope.qr = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + $scope.user.id
      //$scope.getQRCode($scope.user.id);


    }]);
