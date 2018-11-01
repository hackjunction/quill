angular.module('reg')
  .controller('AdminSettingsCtrl', [
    '$scope',
    '$sce',
    'SettingsService',
    function($scope, $sce, SettingsService){

      $scope.settings = {};
      SettingsService
        .getPublicSettings()
        .success(function(settings){
          updateSettings(settings);
        });

      function updateSettings(settings){
        $scope.loading = false;
         // Format the dates in settings.
        settings.timeOpen = new Date(settings.timeOpen);
        settings.timeClose = new Date(settings.timeClose);
        settings.timeConfirm = new Date(settings.timeConfirm);
        settings.timeConfirmSpecial = new Date(settings.timeConfirmSpecial);
        settings.timeCloseSpecial = new Date(settings.timeCloseSpecial);
        settings.timeTR = new Date(settings.timeTR);

        $scope.settings = settings;
      }

      // Whitelist --------------------------------------

      SettingsService
        .getWhitelistedEmails()
        .success(function(emails){
          $scope.whitelist = emails.join(", ");
        });

      $scope.updateWhitelist = function(){
        SettingsService
          .updateWhitelistedEmails($scope.whitelist.replace(/ /g, '').split(','))
          .success(function(settings){
            swal('Whitelist updated.');
            $scope.whitelist = settings.whitelistedEmails.join(", ");
          });
      };

      // Registration Times -----------------------------

      $scope.formatDate = function(date){
        if (!date){
          return "Invalid Date";
        }

        // Hack for timezone
        return moment(date).format('dddd, MMMM Do YYYY, h:mm a') +
          " " + date.toTimeString().split(' ')[2];
      };

      // Take a date and remove the seconds.
      function cleanDate(date){
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes()
        );
      }

      $scope.updateRegistrationTimes = function(){
        // Clean the dates and turn them to ms.
        var open = cleanDate($scope.settings.timeOpen).getTime();
        var close = cleanDate($scope.settings.timeClose).getTime();
        var special = cleanDate($scope.settings.timeCloseSpecial).getTime();

        if (open < 0 || close < 0 || open === undefined || close === undefined || !special){
          return swal('Oops...', 'You need to enter valid times.', 'error');
        }
        if (open >= close){
          swal('Oops...', 'Registration cannot open after it closes.', 'error');
          return;
        }

        SettingsService
          .updateRegistrationTimes(open, close, special)
          .success(function(settings){
            updateSettings(settings);
            swal("Looks good!", "Registration Times Updated", "success");
          });
      };

      // Confirmation Time -----------------------------

      $scope.updateConfirmationTime = function(){
        var confirmBy = cleanDate($scope.settings.timeConfirm).getTime();

        SettingsService
          .updateConfirmationTime(confirmBy)
          .success(function(settings){
            updateSettings(settings);
            swal("Sounds good!", "Confirmation Date Updated", "success");
          });
      };

      // Confirmation Time -----------------------------

      $scope.updateSpecialConfirmationTime = function(){
        var confirmBy = cleanDate($scope.settings.timeConfirmSpecial).getTime();

        SettingsService
          .updateSpecialConfirmationTime(confirmBy)
          .success(function(settings){
            console.log(settings)
            updateSettings(settings);
            swal("Sounds good!", "Special Confirmation Date Updated", "success");
          });
      };

      // TR Closing Time -----------------------

      $scope.updateTRTime = function(){
        var submitTRBy = cleanDate($scope.settings.timeTR).getTime();

        SettingsService
          .updateTRTime(submitTRBy)
          .success(function(settings){
            updateSettings(settings);
            swal("Sounds good!", "TR Closing Date Updated", "success");
          });
      };

      // Acceptance / Confirmation Text ----------------

      var converter = new showdown.Converter();

      $scope.markdownPreview = function(text){
        return $sce.trustAsHtml(converter.makeHtml(text));
      };

      $scope.updateWaitlistText = function(){
        var text = $scope.settings.waitlistText;
        SettingsService
          .updateWaitlistText(text)
          .success(function(data){
            swal("Looks good!", "Waitlist Text Updated", "success");
            updateSettings(data);
          });
      };

      $scope.updateAcceptanceText = function(){
        var text = $scope.settings.acceptanceText;
        SettingsService
          .updateAcceptanceText(text)
          .success(function(data){
            swal("Looks good!", "Acceptance Text Updated", "success");
            updateSettings(data);
          });
      };

      $scope.updateConfirmationText = function(){
        var text = $scope.settings.confirmationText;
        SettingsService
          .updateConfirmationText(text)
          .success(function(data){
            swal("Looks good!", "Confirmation Text Updated", "success");
            updateSettings(data);
          });
      };

      $scope.updateReimbClasses = function() {
        var reimbursementClass = $scope.settings.reimbursementClass;
        SettingsService
          .updateReimbClasses(reimbursementClass)
          .success(function(data){
            swal("Looks good!", "Travel reimbursement classes Updated", "success");
            updateSettings(data);
          });
      };

      $scope.showRejection = function() {
        SettingsService
          .showRejection(true)
          .success(function(data){
            swal("Looks good!", "Rejection will be shown to the participants", "success");
            updateSettings(data);
          });
      };

      $scope.setOnWaitlist = function() {
        SettingsService
          .setOnWaitlist()
          .success(function(data){
            console.log(data)
            swal("Looks good!", data.nModified + " users we're set on waitlist.\nTotal amount of waitlisted people is " + data.n, "success");
          });
      };

    }]);