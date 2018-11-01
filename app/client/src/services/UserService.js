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

      updateProfile: function(id, profile, special){
        return $http.put(base + id + '/profile', {
          profile: profile,
          special: special
        });
      },

      updateEmail: function(id, email) {
        return $http.put(base + id + '/email', {
          email: email
        })
      },

      toggleSpecialRegistration: function(id, current) {
        return $http.put(base + id + '/toggleSpecial', {
          current: current
        })
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
      getTeamInfo: function() {
        return $http.get(base + Session.getUserId() + '/team/info')
      },
      joinTeam: function(code){
        return $http.put(base + Session.getUserId() + '/team/join', {
          code: code
        });
      },
      createTeam: function(){
        return $http.put(base + Session.getUserId() + '/team/create')
      },
      leaveTeam: function(){
        return $http.delete(base + Session.getUserId() + '/team');
      },
      lockTeam: function(teamInterests){
        return $http.put(base + Session.getUserId() + '/team/lock', {
          teamInterests
        })
      },
      kickFromTeam: function(userID) {
        return $http.delete(base + Session.getUserId() + '/team/kick/' + userID)
      },

      getMyTeammates: function(){
        return $http.get(base + Session.getUserId() + '/team');
      },

      updateATalentInterest: function() {
        return $http.post(base + Session.getUserId() + '/talentpool')
      },

      // -------------------------
      // Admin Only
      // -------------------------

      getStats: function(){
        return $http.get(base + 'stats');
      },
      resetTeam: function(id){
        return $http.delete(base + id + '/team');
      },

      admitUser: function(id){
        return $http.post(base + id + '/admit')
      },

      softAdmitUser: function(id, alreadyAdmitted) {
        return $http.post(base + id + '/softAdmit', {alreadyAdmitted});
      },

      acceptTerminal: function(id) {
        return $http.post(base + id + '/acceptTerminal');
      },

      adminUpdateProfile: function(id, profile, special){
        return $http.put('/api/admin/users/' + id + '/profile', {
          profile: profile,
          special: special
        });
      },

      massReject: function() {
        return $http.post(base + 'massReject')
      },

      getRejectionCount: function() {
        return $http.get(base + 'rejectionCount')
      },

      getLaterRejectedCount: function() {
        return $http.get(base + 'laterRejectCount')
      },

      massRejectRest: function() {
        return $http.post(base + 'massRejectRest')
      },

      getRestRejectionCount: function() {
        return $http.get(base + 'rejectionCountRest')
      },

      acceptTravelClassForUser: function(id, reimbClass) {
        return $http.post(base + id + '/acceptTravelClass', {
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

      changeUserPassword: function(id, password) {
        return $http.post(base + id + '/changePassword', {
          password: password
        })
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

      sendRejectEmailsRest: function() {
        return $http.post(base + 'sendRejectEmailsRest');
      },

      sendRejectEmail: function(id) {
        return $http.post(base + id + '/rejectEmail')
      },

      sendPasswordResetEmail: function(email) {
        return $http.post(base + 'sendResetEmail', {email: email})
      }
      /*sendQREmails: function() {
        return $http.post(base + 'sendQREmails');
      },*/

    };
  }
  ]);
