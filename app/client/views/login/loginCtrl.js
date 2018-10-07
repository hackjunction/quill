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
      $scope.specialRegOpen = Utils.isSpecialRegOpen(Settings);

      $scope.specialLogin = window.location.pathname === '/facebookxjunction'

      // Start state for login
      $scope.loginState = 'login';

      var quoteIndex = 0;

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

      $scope.setLoginState = function(state) {
        if ($scope.loginState !== state) {
          resetError();
        }
        $scope.loginState = state;
      };

      $scope.register = function(){
        // Poor mans form validation
        // That MIT guy was pretty lazy lol
        resetError();
        if ($scope.password === $scope.password_repeat) {
          if ($scope.nickname == null) {
            $scope.error = "Please provide a nickname!"
          } 
          else {
            if($scope.regIsOpen){
              var special = false
              AuthService.register(
                $scope.email, $scope.password, $scope.nickname, special, onSuccess, onError);
            }
            else if($scope.specialLogin && $scope.specialRegOpen) {
              var special = true
              AuthService.register(
                $scope.email, $scope.password, $scope.nickname, special, onSuccess, onError);
            }
          }
        } else {
          $scope.error = "Passwords don't match."
        }
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
  quoteIndex = quotes[randomKey].id;
  document.getElementById("quote").innerHTML = ranQuote;
}

function switchQuote(direction){

  if(direction == "left"){
    if(quoteIndex == 0){
      quoteIndex = quotes.length - 1;
      document.getElementById("quote").innerHTML = quotes[quoteIndex].quote;
    }
    else {
      quoteIndex = quoteIndex - 1;
      document.getElementById("quote").innerHTML = quotes[quoteIndex].quote;
    }
  }
  else {
    if(quoteIndex >= (quotes.length - 1)){
      quoteIndex = 1;
      document.getElementById("quote").innerHTML = quotes[quoteIndex].quote;
    }
    else {
      quoteIndex = quoteIndex + 1;
      document.getElementById("quote").innerHTML = quotes[quoteIndex].quote;
    }
  }
}
