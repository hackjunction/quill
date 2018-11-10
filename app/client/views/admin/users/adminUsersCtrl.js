angular.module('reg')
  .controller('AdminUsersCtrl',[
    '$scope',
    '$state',
    '$stateParams',
    'UserService',
    function($scope, $state, $stateParams, UserService){

      $scope.pages = [];
      $scope.users = [];
      // to know when to filter by date
      $scope.sortDate = true;
      $scope.sortRating = true;
      $scope.sortTeam = true;
      $scope.lookingAtATeam = false;
      $scope.sortBy = 'date';

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
      $scope.selectedUsers = [];

      function updatePage(data){
        $scope.users = data.users;
        $scope.currentPage = data.page;
        $scope.pageSize = data.size;

        var p = [];
        for (var i = 0; i < data.totalPages; i++){
          p.push(i);
        }
        $scope.pages = p;
      }

      function serializeFilters(filters) {
        var out = "";
        for (var v in filters) {if(typeof(filters[v])==="boolean"&&filters[v]) out += v+",";}
        return (out.length===0)?"":out.substr(0,out.length-1);
      }

      function deserializeFilters(text) {
        var out = {};
        if (!text) return out;
        text.split(",").forEach(function(f){out[f]=true});
        return (text.length===0)?{}:out;
      }

      $scope.filter = deserializeFilters($stateParams.filter);
      $scope.filter.text = $stateParams.query || "";

      UserService
        .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortBy, $scope.sortDate)
        .success(function(data){
          updatePage(data);
        });

      $scope.sortByRating = function(){
        $scope.sortRating = !$scope.sortRating;
        $scope.sortBy = 'status.rating'
        UserService
                  .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortBy, $scope.sortRating)
                  .success(function(data){
                    updatePage(data)
                  })
      }

      $scope.sortByDate = function(){
        $scope.sortDate = !$scope.sortDate;
        $scope.sortBy = 'timestamp'
        UserService
          .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortBy, $scope.sortDate)
          .success(function(data){
            updatePage(data);
          });
      }

      $scope.sortByTeam = function(){
        $scope.sortTeam = !$scope.sortTeam;
        $scope.sortBy = 'team'
        UserService
          .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortBy, $scope.sortTeam)
          .success(function(data){
            updatePage(data);
          });
      }

      $scope.filterUsers = function() {
        var sortDirection = $scope.sortBy === 'date' ? $scope.sortDate : $scope.sortRating
        $scope.lookingAtATeam = false;
        
        if($scope.filter )
        UserService
          .getPage(
            $stateParams.page,
            $stateParams.size,
            $scope.filter,
            $scope.sortBy,
            sortDirection
          )
          .success(function(data){
            updatePage(data);
          });
      }

      $scope.goToPage = function(page){
        $state.go('app.admin.users', {
          page: page,
          size: $stateParams.size || 50,
          filter:  serializeFilters($scope.filter),
          query: $scope.filter.text
        });
      };

      $scope.goUser = function($event, user){
        $event.stopPropagation();

        $state.go('app.admin.user', {
          id: user._id
        });
      };

      $scope.assignTeam = function($event, team) {
        $event.stopPropagation();

        $('.assignment.modal').modal('show');
      }

      $scope.getTeam = function($event, user) {
        $event.stopPropagation();
        if(user.team !== '' && user.team){
        $scope.lookingAtATeam = true;
        $scope.filter.text = user.team;
        $scope.selectedTeam = user.team;
        const sortDirection = $scope.sortBy === 'date' ? $scope.sortDate : $scope.sortRating
        UserService
          .getPage(
            0,
            $stateParams.size,
            $scope.filter,
            $scope.sortBy,
            sortDirection
          )
          .success(function(dataUsers){
            UserService.getTeamInfoByID(user._id)
              .success(function(team) {
                $scope.assignedTrack = team.assignedTrack;
                $scope.firstPriority = team.firstPriorityTrack;
                $scope.secondPriority = team.secondPriorityTrack;
                $scope.thirdPriority = team.thirdPriorityTrack;
                $scope.selectedUsers = dataUsers.users;
                $scope.teamAverage = $scope.selectedUsers.reduce((sum, user) => sum + user.status.rating, 0) / $scope.selectedUsers.length
                  $('.longer.team.modal')
                      .modal({
                          onHide: function(){
                            $scope.lookingAtATeam = false;
                        }
                      })
                      .modal('show');
                  })
          });
        }
      };

      $scope.assignTeamToTrack = function($event, team) {
        $event.stopPropagation();
        UserService.assignTeam(team, $scope.assignedTrackSelect)
          .success(function(team) {
            $scope.assignedTrack = $scope.assignedTrackSelect;
            swal("Track assigned!", "", "success")
          })
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
                  swal("Accepted", user.profile.name + ' has been checked in.', "success");
                });
            }
          );
        } else {
          UserService
            .checkOut(user._id)
            .success(function(user){
              $scope.users[index] = user;
              swal("Accepted", user.profile.name + ' has been checked out.', "success");
            });
        }
      };

      $scope.resetTeam = function($event, user, index) {
        $event.stopPropagation()
        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to reset team of " + user.profile.name + "!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, reset.",
          closeOnConfirm: false
          },
          function(){
            UserService
              .resetTeam(user._id)
              .success(function(user){
                if(user !== ""){//User cannot be found if user is accepted
                  if(index == null){ //we don't have index because toggleReject has been called in pop-up
                    for(var i = 0; i < $scope.users.length; i++){
                      if($scope.users[i]._id === user._id){
                        $scope.users[i] = user;
                        selectUser(user);
                        }
                      }
                    }
                    else
                      $scope.users[index] = user;
                  swal("Reset", user.profile.name + ' has team reseted.', "success");
                  }
                else
                  swal("Could not reset", 'Users team could not be reseted', "error");
              });
          }
        );
      }

      $scope.toggleReject = function($event, user, index) {
        $event.stopPropagation();

        if (!user.status.rejected){
          swal({
            title: "Whoa, wait a minute!",
            text: "You are about to reject " + user.profile.name + "!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, reject.",
            closeOnConfirm: false
            },
            function(){
              UserService
                .reject(user._id)
                .success(function(user){
                  if(user !== ""){//User cannot be found if user is accepted
                    if(index == null){ //we don't have index because toggleReject has been called in pop-up
                      for(var i = 0; i < $scope.users.length; i++){
                        if($scope.users[i]._id === user._id){
                          $scope.users[i] = user;
                          selectUser(user);
                          }
                        }
                      }
                      else
                        $scope.users[index] = user;
                    swal("Rejected", user.profile.name + ' has been rejected.', "success");
                    }
                  else
                    swal("Could not be rejected", 'User cannot be rejected if its not verified or it is admitted', "error");
                });
            }
          );
        } else {
          UserService
            .unReject(user._id)
            .success(function(user){
              if(index == null){ //we don't have index because toggleReject has been called in pop-up
                for(var i = 0; i < $scope.users.length; i++){
                  if($scope.users[i]._id === user._id){
                    $scope.users[i] = user;
                    selectUser(user);
                    }
                  }
                }
                else
                 $scope.users[index] = user;
              swal("Accepted", user.profile.name + ' has been unrejected.', "success");
            });
        }
      };

      $scope.sendAcceptanceEmails = function() {
        const filterSoftAccepted = $scope.users.filter(u => u.status.softAdmitted && !u.status.admitted)
        swal({
          title: 'Whoa, wait a minute!',
          text: `You're about to send acceptance emails (and accept) ${filterSoftAccepted.length} user(s).`,
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, accept them and send the emails.",
          closeOnConfirm: false
          }, function(){
            if(filterSoftAccepted.length){
              filterSoftAccepted.forEach(user => {
                UserService
                  .admitUser(user._id)
                  .success(function(user) {
                    if(user) {
                      for(var i = 0; i < $scope.users.length; i++){
                        if($scope.users[i]._id === user._id){
                          $scope.users[i] = user;
                        }
                      }
                    } else {
                      swal("Could not be accepted", 'User cannot be accepted if the user is rejected. Please remove rejection', "error");
                    }
                  })
              })
              swal("Sending!", `Accepting and sending emails to ${filterSoftAccepted.length} users!`, "success");
            } else {
              swal("Whoops", "You can't send or accept 0 users!", "error");
            }
          })
      }

      $scope.acceptUserAndSendMail = function($event, user, index) {
        $event.stopPropagation();
        swal({
          title: 'Whoa, wait a minute!',
          text: `You're about to send acceptance email and accept ${user.profile.name}.`,
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, accept and let them know about it!",
          closeOnConfirm: false
          }, function(){
            UserService
              .admitUser(user._id)
              .success(function(user) {
                if(user) {
                  if(index == null){ //we don't have index because toggleReject has been called in pop-up
                    for(var i = 0; i < $scope.users.length; i++){
                      if($scope.users[i]._id === user._id){
                        $scope.users[i] = user;
                      }
                    }
                  }
                  else
                    $scope.users[index] = user;
                    swal("Accepted", user.profile.name + ' has been accepted and an email has been sent! Now the user will see their status updated.', "success");
                } else {
                  swal("Could not be accepted", 'User cannot be accepted if the user is not soft accepted / rejected. Please soft accept first or remove rejection', "error");
                }
              })
          })
      }

      $scope.sendRejectionMail = function($event, user, index) {
        $event.stopPropagation();
        swal({
          title: 'Are you sure?',
          text: `You're about to send reject email to ${user.id}.`,
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, send it!",
          closeOnConfirm: false
          }, function(){
            UserService
              .sendRejectEmail(user._id)
              .success(function(user) {
                swal("Email sent!", 'A rejection email has been sent.', "success");
              })
          })
      }

      $scope.acceptTravelGrantClass = function($event, user, index) {
        $event.stopPropagation();
        if (user.Class == null && user.profile.needsReimbursement){
          swal("Could not be accepted", 'Please select travel reimbursement class', "error");
          return;
        }
        UserService
          .acceptTravelClassForUser(user._id, user.Class)
          .success(function(user) {
            if(user != ""){// User cannot be found if user is rejected
              if(index == null){ //we don't have index because acceptUser has been called in pop-up
                for(var i = 0; i < $scope.users.length; i++){
                  if($scope.users[i]._id === user._id){
                    $scope.users[i] = user;
                    }
                  }
                }
                else
                  $scope.users[index] = user;
                  swal("Travel Grant Class set!", `${user.profile.name} has TG Class set to ${user.profile.AcceptedreimbursementClass}`, "success");
                  $('.travel.modal').modal('hide');
            }
            else
              swal("Could not be accepted", 'User must be Soft Accepted to set their Travel Grant Class. Please Soft Accept them first', "error");
          })
      }

      $scope.acceptTerminal = function($event, user, index) {
        $event.stopPropagation();
        swal({
          title: 'Whoa, wait a minute!',
          text: `You're about to accept ${user.profile.name} to Terminal!`,
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, accept the user to Terminal",
          closeOnConfirm: false
          }, function(){
            UserService
              .acceptTerminal(user._id)
              .success(function(user) {
                if(user != ""){// User cannot be found if user is rejected
                  if(index == null){ //we don't have index because acceptUser has been called in pop-up
                    for(var i = 0; i < $scope.users.length; i++){
                      if($scope.users[i]._id === user._id){
                        $scope.users[i] = user;
                        }
                      }
                    }
                    else
                      $scope.users[index] = user;
                      swal("Accepted to Terminal!", `${user.profile.name} has been accepted to Terminal, they will know this later in emails.`, "success");
                }
                else
                  swal("Could not be accepted", 'User must be Soft Accepted to be accepted to Terminal.', "error");
              })
          })
      }

      $scope.softAcceptUser = function($event, user, index) {
        $event.stopPropagation();

        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to SOFT accept " + user.profile.name + "!" + " This doesn't let the user know if they're accepted yet, it's just internal acceptance.",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, accept them.",
          closeOnConfirm: false
          }, function(){

            swal({
              title: "Are you sure?",
              text: "Your account will be logged as having accepted this user. " +
                "Remember, this power is a privilege.",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Yes, accept this user.",
              closeOnConfirm: false
              }, function(){
                UserService
                  .softAdmitUser(user._id, user.status.softAdmitted)
                  .success(function(user){
                    if(user != ""){// User cannot be found if user is rejected
                      if(index == null){ //we don't have index because acceptUser has been called in pop-up
                        for(var i = 0; i < $scope.users.length; i++){
                          if($scope.users[i]._id === user._id){
                            $scope.users[i] = user;
                            selectUser(user);
                            }
                          }
                        }
                        else
                          $scope.users[index] = user;
                          if(user.status.softAdmitted) swal("Soft Accepted", user.profile.name + ' has been soft accepted', "success");
                          else swal("Removed Soft Acceptance", user.profile.name + ' has been removed from soft admitted status', "success");
                    }
                    else
                      swal("Could not be accepted", 'User cannot be accepted if the user is rejected. Please remove rejection', "error");
                  });
                
              });

          });

      };

      function formatTime(time) {
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      $scope.rowClass = function(user){
        if (user.admin){
          return 'admin';
        }
        if (user.status.confirmed) {
          return 'positive';
        }
        if (user.status.admitted && !user.status.confirmed) {
          return 'warning';
        }
      };

      $scope.openTravelModal = function($event, user) {
        $event.stopPropagation();
        $scope.selectedUser = user;
        $("#travelClass").val(user.profile.AppliedreimbursementClass);
        $scope.selectedUser.Class = user.profile.AppliedreimbursementClass;
        $('.travel.modal').modal('show');
      }

      function rateUser($event, user, index) {
        $event.stopPropagation();
        $scope.selectedUser = user;
        $('.mini.modal').modal('show');
        $('.ui.rating')
          .rating({
            initialRating: user.status.rating,
            maxRating: 5,
            onRate: function(rating){
              $('.mini.modal').modal('hide');
              UserService
                .rateUser(user._id, rating)
                .success(function(u){
                  if(u) {
                    if($scope.lookingAtATeam) {
                      $scope.selectedUsers[index] = u;
                    } else {
                      $scope.users[index] = u;
                    }
                    swal(`Rated ${u.profile.name} with ${rating} stars.`, "success");
                  }
                  else {
                    swal("Something went wrong", "error");
                  }
                });
            }
          });
      }

      function selectUser(user) {
        $scope.selectedUser = user;
        $scope.selectedUser.sections = generateSections(user);
        $('.long.user.modal')
          .modal('show');
      }

       $scope.exportCSV = function(){
        UserService
        .getAll()
        .success(function(data){

          var output = "";
          var titles = generateSections(data[0]);
           for(var i = 0; i < titles.length; i++){
            for(var j = 0; j < titles[i].fields.length; j++){
              output += titles[i].fields[j].name + ",";
            }
           }
           output += "\r\n";

          for (var rows = 0; rows < data.length; rows++){
            row = generateSections(data[rows]);
            for (var i = 0; i < row.length; i++){
              for(var j = 0; j < row[i].fields.length;j++){
                if(!row[i].fields[j].value){
                  output += ",";
                  continue;
                }
                var field = row[i].fields[j].value;
                try {
                  output += field.replace(/(\r\n|\n|\r|,)/gm," ") + ",";
                } catch (err){
                  output += field + ",";
                }
              }
            }
            output += "\r\n";
          }

          var csvData = new Blob([output], { type: 'text/csv' }); 
          var csvUrl = URL.createObjectURL(csvData);

          var element = document.createElement('a');
          element.setAttribute('href', csvUrl);
          element.setAttribute('download', "base " + new Date().toDateString() + ".csv");
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

          });
      }

      function fixLink(string) {
        var http = 'http://'
        var https = 'https://'

        if(!string.startsWith(http) && !string.startsWith(https)) {
          return https + string
        }

        return string
      }

      $scope.getStatusName = function(user) {
        if(user.status){
          if (user.status.checkedIn) {
            return 'checked in';
          }
        
          if (user.status.declined) {
            return "declined";
          }
        
          if (user.status.confirmed) {
            return "confirmed";
          }
          if (user.status.softAdmitted) {
            return "Soft Admitted - admitted but user doesn't know it yet"
          }
          if (user.status.admitted) {
            return "admitted";
          }
          if (user.status.completedProfile){
            return "submitted";
          }
        
          if (!user.verified){
            return "unverified";
          }
        }
        return "incomplete";
      }

      function generateSections(user){
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Created On',
                value: formatTime(user.timestamp)
              },
              {
                name: 'wants on mail list',
                type: 'boolean',
                value: user.profile.emailNews
              },{
                name: 'Last Updated',
                value: formatTime(user.lastUpdated)
              },{
                name: 'Confirm By',
                value: formatTime(user.status.confirmBy) || 'N/A'
              },{
                name: 'Rejected',
                value: user.status.rejected
              },{
                name: 'Checked In',
                value: formatTime(user.status.checkInTime) || 'N/A'
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
                value: user.team || 'None'
              },{
                name: 'Requested travel reimbursement class',
                value: user.profile.needsReimbursement && user.profile.AppliedreimbursementClass || 'None'
              },{
                name: 'Accepted travel reimbursement',
                value: user.profile.AcceptedreimbursementClass || 'None'
              }
            ]
          },{
            name: 'Profile',
            fields: [
              {
                name: 'Age',
                value: user.profile.age
              },{
                name: 'Gender',
                value: user.profile.gender
              },{
                name: 'Phone',
                value: user.confirmation.phone
              },{
                name: 'Enrolled in school',
                value: user.profile.school ? true : false,
                type: 'boolean'
              },{
                name: 'School',
                value: user.profile.school
              },{
                name: 'Graduation Year',
                value: user.profile.graduationYear ? user.profile.graduationYear : (user.profile.oldDegree ? user.profile.oldDegree.graduationYear : '')
              },{
                name: 'Major',
                value: user.profile.major ? user.profile.major : (user.profile.oldDegree ? user.profile.oldDegree.major : '')
              },{
                name: 'Degree',
                value: user.profile.degree ? user.profile.degree : (user.profile.oldDegree ? user.profile.oldDegree.degree : '')
              },{
                name: 'Languages with working effiency',
                value: user.profile.workingLanguages ? user.profile.workingLanguages.join(' & ') : ''
              },{
                name: 'Travels from Country',
                value: user.profile.travelFromCountry
              },{
                name: 'Travels from City',
                value: user.profile.travelFromCity
              },{
                name: 'Nationality',
                value: user.profile.homeCountry
              },{
                name: 'Main Description',
                value: `${user.profile.mainRole} - ${user.profile.bestRole}`
              },
              {
                name: 'Years of Experience in the field',
                value: user.profile.yearsOfExperience
              },
              {
                name: 'Secondary Description',
                value: `${user.profile.subRole} - ${user.profile.secondBestRole}`
              },{
                name: 'Needs Visa',
                value: user.profile.needsVisa,
                type: 'boolean'
              },{
                name: 'Needs Travel Reimbursement',
                value: user.profile.needsReimbursement,
                type: 'boolean'
              },{
                name: 'Needs Accommodation',
                value: user.profile.applyAccommodation,
                type: 'boolean'
              },{
                name: 'Most interesting themes',
                value: user.profile.mostInterestingThemes ? user.profile.mostInterestingThemes.join(' & ') : ''
              },{
                name: 'Professional Skills',
                value: user.profile.professionalSkills ? user.profile.professionalSkills.join(' & ') : ''
              },{
                name: 'Advanced Skills',
                value: user.profile.advancedSkills ? user.profile.advancedSkills.join(' & ') : ''
              },{
                name: 'Intermediate Skills',
                value: user.profile.intermediateSkills ? user.profile.intermediateSkills.join(' & ') : ''
              },{
                name: 'Beginnner Skills',
                value: user.profile.beginnerSkills ? user.profile.beginnerSkills.join(' & ') : ''
              },{
                name: 'Hackathons visited',
                value: user.profile.howManyHackathons
              },{
                name: 'Motivation',
                value: user.profile.essay
              },
            ]
          },{
            name: 'Terminal',
            fields: [
              {
                name: 'Terminal Motivation',
                value: user.profile.terminal ? user.profile.terminal.essay : ''
              },
              {
                name: 'Special skills',
                value: user.profile.terminal ? user.profile.terminal.skills : ''
              },
              {
                name: 'Industries',
                value: user.profile.terminal ? user.profile.terminal.terminalIndustries.join(' & ') : ''
              },{
                name: 'Coolest Thing worked on',
                value: user.profile.terminal ? user.profile.terminal.coolestThing : ''
              },{
                name: 'Link to portfolio',
                value: user.profile.terminal && user.profile.terminal.portfolio ? fixLink(user.profile.terminal.portfolio) : '',
                type: 'link'
              },{
                name: 'Needs Accommodation',
                value: user.profile.terminal ? user.profile.terminal.needsAccommodation : false
              },{
                name: 'Accommodates People',
                value: user.profile.terminal ? user.profile.terminal.accommodatesAmount : ''
              },{
                name: 'Confirmed attendance',
                value: user.confirmation.terminalConfirmation,
                type: 'boolean'
              }
            ]
          },{
            name: 'Additional',
            fields: [
              {
                name: 'Portfolio',
                value: user.profile.portfolio ? fixLink(user.profile.portfolio) : '',
                type: 'link'
              },
              {
                name: 'Linkedin',
                value: user.profile.linkedin ? fixLink(user.profile.linkedin) : '',
                type: 'link'
              },
              {
                name: 'Github',
                value: user.profile.github ? fixLink(user.profile.github) : '',
                type: 'link'
              },
              {
                name: 'Interest in job opportunities',
                value: user.profile.jobOpportunities
              },
              {
                name: 'Wants to be contacted by aTalent',
                value: user.profile.aTalentContact,
                type: 'boolean'
              },
              {
                name: 'Special Needs',
                value: user.confirmation.specialNeeds || 'None'
              },{
                name: 'Previous Junctions',
                value: user.profile.previousJunction.join(' & ')
              },{
                name: 'Secret code',
                value: user.profile.secret
              },{
                name: 'Free comment',
                value: user.profile.freeComment
              },{
                name: 'OS',
                value: user.profile.operatingSystem
              },{
                name: 'Spaces or Tabs',
                value: user.profile.spacesOrTabs
              },
            ]
          },{
            name: 'Confirmation',
            fields: [
              {
                name: 'Dietary Restrictions',
                value: user.confirmation.dietaryRestrictions.join(' & ')
              },{
                name: 'Shirt Size',
                value: user.confirmation.shirtSize
              },{
                name: 'Needs Hardware',
                value: user.confirmation.needsHardware,
                type: 'boolean'
              },{
                name: 'Hardware Requested',
                value: user.confirmation.hardware
              },{
                name: 'Additional notes',
                value: user.confirmation.notes
              }
            ]
          }
        ];
      }

      function generateTRSections(user){
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Name',
                value: user.profile.name
              },{
                name: 'Email',
                value: user.email
              },{
                name: 'ID',
                value: user.id
              },{
                name: 'Requested travel reimbursement class',
                value: user.profile.needsReimbursement && user.profile.AppliedreimbursementClass || 'None'
              },{
                name: 'Accepted travel reimbursement',
                value: user.profile.AcceptedreimbursementClass || 'None'
              }
            ]
          },{
            name: 'Profile',
            fields: [
              {
                name: 'Phone',
                value: user.confirmation.phone
              },{
                name: 'Travels from Country',
                value: user.profile.travelFromCountry
              },{
                name: 'Travels from City',
                value: user.profile.travelFromCity
              },{
                name: 'Home Country',
                value: user.profile.homeCountry
              },
            ]
          },{
            name: 'Reimbursement',
            fields: [
              {
                name: 'Date of birth',
                value: formatTime(user.reimbursement.dateOfBirth)
              },{
                name: 'AddressLine 1',
                value: user.reimbursement.addressLine1
              },{
                name: 'AddressLine 2',
                value: user.reimbursement.addressLine2
              },{
                name: 'City',
                value: user.reimbursement.city
              },{
                name: 'Zip Code',
                value: user.reimbursement.zipCode
              },{
                name: 'PayPal Email',
                value: user.reimbursement.paypalEmail
              },{
                name: 'Total Sum',
                value: user.reimbursement.totalSum
              },{
                name: 'Additional',
                value: user.reimbursement.additional
              },
            ]
          },
        ];
      }

      $scope.exportMailList = function() {
        UserService
        .getAll()
        .success(function(data){
          data = data.filter(function(user){
            return user.profile.emailNews;
          }).map(user => user.email)
          var output = "";
          
          data.forEach(function(row) {
            output += row;
            output += "\r\n";
          })

          var csvData = new Blob([output], { type: 'text/csv' }); 
          var csvUrl = URL.createObjectURL(csvData);

          var element = document.createElement('a');
          element.setAttribute('href', csvUrl);
          element.setAttribute('download', "Mailing list " + new Date().toDateString() + ".csv");
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

          });
      }

      $scope.exportTRCSV = function() {
        UserService
        .getAll()
        .success(function(data){
          data = data.filter(function(user){
            return user.profile.AcceptedreimbursementClass && user.profile.AcceptedreimbursementClass !== "None" && !user.status.declined;
          })
          var output = "";
          var titles = generateTRSections(data[0]);
          for(var i = 0; i < titles.length; i++){
            for(var j = 0; j < titles[i].fields.length; j++){
              output += titles[i].fields[j].name + ",";
            }
          }
          output += "\r\n";

          for (var rows = 0; rows < data.length; rows++){
            row = generateTRSections(data[rows]);
            for (var i = 0; i < row.length; i++){
              for(var j = 0; j < row[i].fields.length;j++){
                if(!row[i].fields[j].value){
                  output += ",";
                  continue;
                }
                var field = row[i].fields[j].value;
                try {
                  output += field.replace(/(\r\n|\n|\r|,)/gm," ") + ",";
                } catch (err){
                  output += field + ",";
                }
              }
            }
            output += "\r\n";
          }

          var csvData = new Blob([output], { type: 'text/csv' }); 
          var csvUrl = URL.createObjectURL(csvData);

          var element = document.createElement('a');
          element.setAttribute('href', csvUrl);
          element.setAttribute('download', "Travel Grants " + new Date().toDateString() + ".csv");
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

          });
      }

      $scope.selectUser = selectUser;
      $scope.rateUser = rateUser;

        $scope.$on('$viewContentLoaded', function () {
            $('.coupled.modal')
                .modal({
                    allowMultiple: true
                })
            ;
        });

    }]);
