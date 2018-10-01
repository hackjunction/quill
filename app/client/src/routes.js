angular.module('reg')
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    '$locationProvider',
    function(
      $stateProvider,
      $urlRouterProvider,
      $locationProvider) {

    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/404");

    // Set up de states
    $stateProvider
      .state('login', {
        url: "/login",
        templateUrl: "views/login/login.html",
        controller: 'LoginCtrl',
        data: {
          requireLogin: false
        },
        resolve: {
          'settings': function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        }
      })
      .state('app', {
        views: {
          '': {
            templateUrl: "views/base.html"
          },
          'sidebar@app': {
            templateUrl: "views/sidebar/sidebar.html",
            controller: 'SidebarCtrl',
            resolve: {
              'settings' : function(SettingsService) {
                return SettingsService.getPublicSettings();
              }
            }

          }
        },
        data: {
          requireLogin: true
        }
      })
      .state('app.dashboard', {
        url: "/",
        templateUrl: "views/dashboard/dashboard.html",
        controller: 'DashboardCtrl',
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          },
          settings: function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        },
      })
      .state('app.application', {
        url: "/application",
        templateUrl: "views/application/application.html",
        controller: 'ApplicationCtrl',
        data: {
          requireVerified: true
        },
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          },
          settings: function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        }
      })
      .state('app.confirmation', {
        url: "/confirmation",
        templateUrl: "views/confirmation/confirmation.html",
        controller: 'ConfirmationCtrl',
        data: {
          requireVerified: true,
          requireAdmitted: true
        },
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          }
        }
      })
      .state('app.team', {
        url: "/team",
        templateUrl: "views/team/team.html",
        controller: 'TeamCtrl',
        data: {
          requireApplied: true
        },
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          },
          settings: function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        }
      })
      .state('app.matchmaking', {
        url: "/matchmaking",
        templateUrl: "views/matchmaking/matchmaking.html",
        controller: 'MatchmakingCtrl',
        data: {
          requireApplied: true
        },
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          },
          settings: function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        }
      })
      .state('app.matchmaking.teams', {
        url: "/matchmaking/teams",
        templateUrl: "views/matchmaking/teams/teams.html",
        controller: 'TeamsCtrl',
        data: {
          requireApplied: true
        },
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          },
          settings: function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        }
      })
      .state('app.matchmaking.individuals', {
        url: "/matchmaking/individuals",
        templateUrl: "views/matchmaking/individuals/individuals.html",
        controller: 'IndividualsCtrl',
        data: {
          requireApplied: true
        },
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          },
          settings: function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        }
      })
      .state('app.admin', {
        views: {
          '': {
            templateUrl: "views/admin/admin.html",
            controller: 'AdminCtrl'
          }
        },
        data: {
          requireAdmin: true
        }
      })
      .state('app.checkin', {
        url: '/checkin',
        templateUrl: 'views/checkin/checkin.html',
        controller: 'CheckinCtrl',
        data: {
          requireVolunteer: true
        }
      })
      .state('app.reimbursement', {
        url: "/travelreimbursement",
        templateUrl: "views/reimbursement/reimbursement.html",
        controller: 'ReimbursementCtrl',
        data: {
          requireConfirmed: true,
          requireTravelReimbursementNeeded: true,
          requireTravelReimbursementClassIsNotRejected: true
        },
        resolve: {
          currentUser: function(UserService){
            return UserService.getCurrentUser();
          },
          settings: function(SettingsService){
            return SettingsService.getPublicSettings();
          }
        }
      })


      .state('app.admin.stats', {
        url: "/admin",
        templateUrl: "views/admin/stats/stats.html",
        controller: 'AdminStatsCtrl'
      })
      .state('app.admin.users', {
        url: "/admin/users?" +
          '&page' +
          '&size' +
          '&filter' +
          '&query',
        templateUrl: "views/admin/users/users.html",
        controller: 'AdminUsersCtrl'
      })
      .state('app.admin.user', {
        url: "/admin/users/:id",
        templateUrl: "views/admin/user/user.html",
        controller: 'AdminUserCtrl',
        resolve: {
          'user': function($stateParams, UserService){
            return UserService.get($stateParams.id);
          }
        }
      })
      .state('app.admin.settings', {
        url: "/admin/settings",
        templateUrl: "views/admin/settings/settings.html",
        controller: 'AdminSettingsCtrl',
      })
      .state('reset', {
        url: "/reset/:token",
        templateUrl: "views/reset/reset.html",
        controller: 'ResetCtrl',
        data: {
          requireLogin: false
        }
      })
      .state('verify', {
        url: "/verify/:token",
        templateUrl: "views/verify/verify.html",
        controller: 'VerifyCtrl',
        data: {
          requireLogin: false
        }
      })
      .state('404', {
        url: "/404",
        templateUrl: "views/404.html",
        data: {
          unmatched: true
        }
      });

    $locationProvider.html5Mode({
      enabled: true,
    });

  }])
  .run([
    '$rootScope',
    '$state',
    'Session',
    function(
      $rootScope,
      $state,
      Session ){

      $rootScope.$on('$stateChangeSuccess', function() {
         document.body.scrollTop = document.documentElement.scrollTop = 0;
      });

      $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        var unmatched = toState.data.unmatched;
        var requireLogin = toState.data.requireLogin;
        var requireAdmin = toState.data.requireAdmin;
        var requireVolunteer = toState.data.requireVolunteer;
        var requireVerified = toState.data.requireVerified;
        var requireApplied = toState.data.requireApplied;
        var requireAdmitted = toState.data.requireAdmitted;
        var requireConfirmed = toState.data.requireConfirmed;
        var requireTravelReimbursementNeeded = toState.data.requireTravelReimbursementNeeded;
        var requireTravelReimbursementClassIsNotRejected = toState.data.requireTravelReimbursementClassIsNotRejected;

        if (unmatched){
          event.preventDefault();
          $state.go('app.dashboard');
        }

        if (requireLogin && !Session.getToken()) {
          event.preventDefault();
          $state.go('login');
        }

        if (requireAdmin && !Session.getUser().admin) {
          event.preventDefault();
          $state.go('app.dashboard');
        }

        if((requireVolunteer && !Session.getUser().volunteer) && (requireVolunteer && !Session.getUser().admin)){
          event.preventDefault();
          $state.go('app.dashboard');
        }

        if (requireVerified && !Session.getUser().verified){
          event.preventDefault();
          $state.go('app.dashboard');
        }

        if(requireApplied && !Session.getUser().status.completedProfile){
          event.preventDefault();
          $state.go('app.dashboard');
        }

        if(requireAdmitted && !Session.getUser().status.admitted){
          event.preventDefault();
          $state.go('app.dashboard');
        }
        if((requireConfirmed && !(Session.getUser().status.confirmed)) || (requireTravelReimbursementClassIsNotRejected && Session.getUser().profile.AcceptedreimbursementClass === 'None') || (requireTravelReimbursementClassIsNotRejected && !Session.getUser().profile.AcceptedreimbursementClass)){
          event.preventDefault();
          $state.go('app.dashboard');
        }

      });

    }]);
