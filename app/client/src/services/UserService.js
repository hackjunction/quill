angular.module('reg')
  .factory('UserService', [
  '$http',
  'Session',
  function($http, Session){

    var users = '/api/users';
    var base = users + '/';

    return {

      // ----------------------
      // Basic Actions
      // ----------------------
      getCurrentUser: function(){
        return $http.get(base + Session.getUserId());
      },

      get: function(id){
        return $http.get(base + id);
      },

      getAll: function(){
        return $http.get(base);
      },

      getPage: function(page, size, filter, sortBy, sortDir){
        return $http.get(users + '?' + $.param(
          {
            filter: filter,
            page: page ? page : 0,
            size: size ? size : 50,
            sortBy: sortBy,
            sortDir: sortDir,
          })
        );
      },

      getMatchmaking: function(type, page, size, filter) {
        return $http.get('/api/matchmaking/data/' + '?' + $.param(
          {
            filter: filter,
            type: type,
            page: page ? page: 0,
            size: size ? size : 50
          })
        )
      },

      exitSearch: function() {
        return $http.put('/api/matchmaking/exitSearch')
      },

      getTeamSearching: function() {
        return $http.get('/api/matchmaking/teamInSearch')
      },

      updateProfile: function(id, profile){
        return $http.put(base + id + '/profile', {
          profile: profile
        });
      },

      updateMatchmakingProfile: function(id, profile){
        return $http.put(base + id + '/matchmaking', {
          profile: profile
        });
      },

      updateConfirmation: function(id, confirmation){
        return $http.put(base + id + '/confirm', {
          confirmation: confirmation
        });
      },

      updateReimbursement: function(id, reimbursement) {
        return $http.put(base + id + '/reimbursement', {
          reimbursement: reimbursement
        });
      },

      declineAdmission: function(id){
        return $http.post(base + id + '/decline');
      },

      // ------------------------
      // Team
      // ------------------------
      joinOrCreateTeam: function(code){
        return $http.put(base + Session.getUserId() + '/team', {
          code: code
        });
      },

      leaveTeam: function(){
        return $http.delete(base + Session.getUserId() + '/team');
      },

      getMyTeammates: function(){
        return $http.get(base + Session.getUserId() + '/team');
      },

      // -------------------------
      // Admin Only
      // -------------------------

      getStats: function(){
        return $http.get(base + 'stats');
      },

      admitUser: function(id, reimbClass){
        return $http.post(base + id + '/admit', {
          reimbClass: reimbClass
        });
      },
      
      rateUser: function(id, rating) {
        return $http.post(base + id + '/rate', {
          rating
        })
      },

      reject: function(id){
        return $http.post(base + id + '/reject');
      },

      unReject: function(id){
        return $http.post(base + id + '/unreject');
      },

      checkIn: function(id){
        return $http.post(base + id + '/checkin');
      },

      QRcheckIn: function(id){
        return $http.post(base + id + '/qrcheck');
      },

      checkOut: function(id){
        return $http.post(base + id + '/checkout');
      },

      sendLaggerEmails: function() {
        return $http.post(base + 'sendlagemails');
      },

      sendRejectEmails: function() {
        return $http.post(base + 'sendRejectEmails');
      },
      /*sendQREmails: function() {
        return $http.post(base + 'sendQREmails');
      },*/

    };
  }
  ]);
