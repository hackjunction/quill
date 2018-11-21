angular.module('reg')
.controller('CheckinCtrl', [
  '$scope',
  '$state',
  '$stateParams',
  'UserService',
  function($scope, $state, $stateParams, UserService){
    $('#reader').html5_qrcode(function(data){
          //Change the input fields value and send post request to the backend
          UserService
            .QRcheckIn(data)
            .success(function(user){
              $scope.filter.text = data;
              $scope.filterUsers();
              //selectUser(user);
            })
            .error(function(res){
              if(res === "User not confirmed!"){
                sweetAlert("Hey!", "This user did not confirm they are coming!", "error");
              }
              /*else if(res === "User already checked in!"){
                sweetAlert("Again?", "User already checked in!", "error")
              }*/
              else if(res === "User is rejected!"){
                sweetAlert("Hey!", "This user is rejected!", "error");                
              }
              else{
                sweetAlert("Uh oh!", "User does not exist or isn't admitted!", "error");
              }
            });
        },
      function(error){
      }, function(videoError){
        //the video stream could be opened
      }
    );
    $scope.pages = [];
    $scope.users = [];
    $scope.sortBy = 'timestamp'
    $scope.sortDir = false

    $scope.filter = deserializeFilters($stateParams.filter);
    $scope.filter.text = $stateParams.query || "";

    console.log($scope.filter)

    function deserializeFilters(text) {
      var out = {};
      if (!text) return out;
      text.split(",").forEach(function(f){out[f]=true});
      return (text.length===0)?{}:out;
    }

    function serializeFilters(filters) {
      var out = "";
      for (var v in filters) {if(typeof(filters[v])==="boolean"&&filters[v]) out += v+",";}
      return (out.length===0)?"":out.substr(0,out.length-1);
    }

    // Semantic-UI moves modal content into a dimmer at the top level.
    // While this is usually nice, it means that with our routing will generate
    // multiple modals if you change state. Kill the top level dimmer node on initial load
    // to prevent this.
    $('.ui.dimmer').remove();
    // Populate the size of the modal for when it appears, with an arbitrary user.
    $scope.selectedUser = {};
    $scope.selectedUser.sections = generateSections({status: '',
    confirmation: {
      dietaryRestrictions: []
    }, profile: {
      occupationalStatus: [],
      bestTools: [],
      previousJunction: []
    }, reimbursement: {
          dateOfBirth: [],
    }
    });

    function updatePage(data){
      $scope.users = data.users.filter(function(user){
        return user.status.admitted !== false;
      }).filter(function(user){
        return user.status.declined !== true;
      });
      $scope.currentPage = data.page;
      $scope.pageSize = data.size;

      var p = [];
      for (var i = 0; i < data.totalPages; i++){
        p.push(i);
      }
      $scope.pages = p;
    }

    $scope.goToPage = function(page){
      $state.go('app.checkin', {
        page: page,
        size: $stateParams.size || 50,
        filter:  serializeFilters($scope.filter),
        query: $scope.filter.text
      });
    };

    console.log($stateParams)

    $scope.filterUsers = function() {
      UserService
        .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortBy, $scope.sortDir)
        .success(function(data){
          updatePage(data);
        });
    }

    $scope.toggleCheckIn = function($event, user, index) {
      $event.stopPropagation();

      if (!user.status.checkedIn){
        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to check in " + user.profile.name + "!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, check them in.",
          closeOnConfirm: false
          },
          function(){
            UserService
              .checkIn(user._id)
              .success(function(user){
                $scope.users[index] = user;
                swal("Check!", user.profile.name + ' has been checked in.', "success");
              });
          }
        );
      } 
      else {
        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to check out " + user.profile.name + "!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, check them out.",
          closeOnConfirm: false
          }, 
          function(){
            swal({
              title: "Are you ABSOLUTELY SURE?",
              text: "You are about to CHECK OUT " + user.profile.name + "!",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Yes, CHECK OUT.",
              closeOnConfirm: false
              }, function(){
              UserService
                .checkOut(user._id)
                .success(function(user){
                  $scope.users[index] = user;
                  swal("Checked out", user.profile.name + ' has been checked out.', "success");
            })
          });
      })}
    
    };

    function selectUser(user){
      $scope.selectedUser = user;
      if(user.team) {
        UserService.getTeamInfoByID(user._id).success(function(team) {
          $scope.selectedUser.assignedTrack = team.assignedTrack
          $scope.selectedUser.sections = generateSections(user);
          $('.long.user.modal')
            .modal('show');
        })
      }
      else {
        $scope.selectedUser.sections = generateSections(user);
        $('.long.user.modal')
          .modal('show');
      }
    }

    $scope.checkInUser = function($event, user, index) {
      $event.stopPropagation();


      swal({
        title: "Whoa, wait a minute!",
        text: "You are about to check in " + user.profile.name + "!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, CHECK IN!",
        closeOnConfirm: false
        }, function(){


          UserService
            .checkIn(user._id)
            .success(function(user){
               swal("Checked in!", user.profile.name + ' has been checked in succesfully!.', "success");
            })
            .error(function(){
               swal("Something went wrong!", "error")
            });

        });

    };

    UserService
      .getPage($stateParams.page, $stateParams.size, $scope.filter, 'timestamp', false)
      .success(function(data){
        updatePage(data);
      });

      function formatTime(time){
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      function generateSections(user){
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Checked In',
                value: user.status.checkedIn,
                type: 'boolean'
              },{
                name: 'Name',
                value: user.profile.name
              },{
                name: 'Email',
                value: user.email
              },{
                name: 'ID',
                value: user.id
              },{
                name: 'Team',
                value: user.teamCode || 'None'
              }
            ]
          },{
            name: 'Profile',
            fields: [
              {
                name: 'Age',
                value: user.profile.age
              },{
                name: 'Travels from Country',
                value: user.profile.travelFromCountry
              },{
                name: 'Travels from City',
                value: user.profile.travelFromCity
              },{
                name: 'Home Country',
                value: user.profile.homeCountry
              },{
                name: 'Most interesting track',
                value: user.profile.mostInterestingTrack
              },
              {
                name: 'Applied for accommodation',
                value: user.profile.applyAccommodation,
                type: 'boolean'
              },
              {
                name: 'Applied for travel reimbursement',
                value: user.status.reimbursementApplied,
                type: 'boolean'
              },
              {
                name: 'Admitted reimbursement class',
                value: user.profile.AcceptedreimbursementClass || 'None'
              }
            ]
          },{
            name: 'Confirmation',
            fields: [
              {
                name: 'Shirt Size',
                value: user.confirmation.shirtSize,
                type: 'string'
              },{
                name: 'Needs Hardware',
                value: user.confirmation.needsHardware,
                type: 'boolean'
              }
            ]
          },
        ];
      }
      $scope.selectUser = selectUser;
  }]);