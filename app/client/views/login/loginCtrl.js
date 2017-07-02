var quotes;

angular.module('reg')
  .controller('LoginCtrl', [
    '$scope',
    '$http',
    '$state',
    'settings',
    'Utils',
    'AuthService',
    function($scope, $http, $state, settings, Utils, AuthService){

      // Is registration open?
      var Settings = settings.data;
      $scope.regIsOpen = Utils.isRegOpen(Settings);

      // Start state for login
      $scope.loginState = 'login';

      function onSuccess() {
        $state.go('app.dashboard');
      }

      function onError(data){
        $scope.error = data.message;
      }

      function resetError(){
        $scope.error = null;
      }

      $scope.login = function(){
        resetError();
        AuthService.loginWithPassword(
          $scope.email, $scope.password, onSuccess, onError);
      };

      $scope.register = function(){
        resetError();
        if ($scope.password === $scope.password_repeat) {
          AuthService.register(
            $scope.email, $scope.password, $scope.nickname, onSuccess, onError);
        } else {
          $scope.error = "Passwords don't match."
        }
      };

      $scope.setLoginState = function(state) {
        $scope.loginState = state;
      };

      $scope.sendResetEmail = function() {
        var email = $scope.email;
        AuthService.sendResetEmail(email);
        sweetAlert({
          title: "Don't Sweat!",
          text: "An email should be sent to you shortly.",
          type: "success",
          confirmButtonColor: "#e76482"
        });
      };

    }
  ]);
$.getJSON('../assets/quotes.json').done(function(data){
      quotes = data;
});
function fdIn() {
  $("#login").hide();
  $(document).ready(function () {
    $('#login').fadeIn(1000);
  });
}
function randomQuote(){
  var keys = Object.keys(quotes)
  var randomKey = keys[Math.floor(Math.random() * keys.length)];
  var ranQuote = quotes[randomKey].quote;
  document.getElementById("quote").innerHTML = ranQuote
}
