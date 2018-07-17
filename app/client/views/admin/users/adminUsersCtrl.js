angular.module('reg')
  .controller('AdminUsersCtrl',[
    '$scope',
    '$state',
    '$stateParams',
    'UserService',
    ($scope, $state, $stateParams, UserService) => {

      $scope.pages = [];
      $scope.users = [];
      // to know when to filter by date
      $scope.sortDate = true;

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
      const updatePage = data => {
        $scope.users = data.users;
        $scope.currentPage = data.page;
        $scope.pageSize = data.size;

        let p = [];
        for (let i = 0; i < data.totalPages; i++){
          p.push(i);
        }
        $scope.pages = p;
      }

      UserService
        .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortDate)
        .success(function(data){
          updatePage(data);
        });

      $scope.sortByDate = () => {
        $scope.sortDate = !$scope.sortDate;
        UserService
                  .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortDate)
                  .success(data => {
                    updatePage(data);
                  });
      }

      $scope.filterUsers = () => {
        UserService
          .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortDate)
          .success(data => {
            updatePage(data);
          });
      }

      $scope.goToPage = page => {
        $state.go('app.admin.users', {
          page: page,
          size: $stateParams.size || 50
        });
      };

      $scope.goUser = ($event, user) => {
        $event.stopPropagation();

        $state.go('app.admin.user', {
          id: user._id
        });
      };

      $scope.toggleCheckIn = ($event, user, index) => {
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
            () => {
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
            .success(user => {
              $scope.users[index] = user;
              swal("Accepted", user.profile.name + ' has been checked out.', "success");
            });
        }
      };

      $scope.toggleReject = ($event, user, index) => {
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
            () => {
              UserService
                .reject(user._id)
                .success(user => {
                  if(user !== ""){//User cannot be found if user is accepted
                    if(index == null){ //we don't have index because toggleReject has been called in pop-up
                      for(let i = 0; i < $scope.users.length; i++){
                        if($scope.users[i]._id === user._id){
                          $scope.users[i] = user;
                          selectUser(user);
                          }
                        }
                      }
                      else
                        $scope.users[index] = user;
                    swal("Accepted", user.profile.name + ' has been rejected.', "success");
                    }
                  else
                    swal("Could not be rejected", 'User cannot be rejected if its not verified or it is admitted', "error");
                });
            }
          );
        } else {
          UserService
            .unReject(user._id)
            .success(user => {
              if(index == null){ //we don't have index because toggleReject has been called in pop-up
                for(let i = 0; i < $scope.users.length; i++){
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

      $scope.acceptUser = ($event, user, index) => {
        $event.stopPropagation();

        if (user.Class == null && user.profile.needsReimbursement){
          swal("Could not be accepted", 'Please select travel reimbursement class', "error");
          return;
        }
        else if(user.profile.needsReimbursement && user.Class === "Special" && user.SpecialClass != parseInt(user.SpecialClass,10)) {
          swal("Could not be accepted", 'Special class input needs to be integer', "error");
          return;
        }
        let Class;
        if (user.Class === 'Special')
          Class = user.SpecialClass;
        else
          Class = user.Class;

        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to accept " + user.profile.name + "!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, accept them.",
          closeOnConfirm: false
          }, () => {

            swal({
              title: "Are you sure?",
              text: "Your account will be logged as having accepted this user. " +
                "Remember, this power is a privilege.",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Yes, accept this user.",
              closeOnConfirm: false
              }, () => {

                UserService
                  .admitUser(user._id, Class)
                  .success(user => {
                    if(user != ""){// User cannot be found if user is rejected
                      if(index == null){ //we don't have index because acceptUser has been called in pop-up
                        for(let i = 0; i < $scope.users.length; i++){
                          if($scope.users[i]._id === user._id){
                            $scope.users[i] = user;
                            selectUser(user);
                            }
                          }
                        }
                        else
                          $scope.users[index] = user;
                          swal("Accepted", user.profile.name + ' has been admitted.', "success");
                    }
                    else
                      swal("Could not be accepted", 'User cannot be accepted if the user is rejected. Please remove rejection', "error");
                  });

              });

          });

      };

      const formatTime = time => {
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      $scope.rowClass = user => {
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

      const openUserRating = ($event, user) => {
        $event.stopPropagation();
        $scope.selectedUser = user;
        $('.ui.rating')
          .rating({
            initialRating: user.status.rating,
            maxRating: 5
          });
        $('.small.modal').modal('show');
      }

      const selectUser = user => {
        $scope.selectedUser = user;
        $scope.selectedUser.sections = generateSections(user);
        $('.long.user.modal')
          .modal('show');
      }

       $scope.exportCSV = () => {
        UserService
        .getAll()
        .success(data => {

          let output = "";
          let titles = generateSections(data[0]);
           for(let i = 0; i < titles.length; i++){
            for(let j = 0; j < titles[i].fields.length; j++){
              output += titles[i].fields[j].name + ";";
            }
           }
           output += "\n";

          for (let rows = 0; rows < data.length; rows++){
            row = generateSections(data[rows]);
            for (let i = 0; i < row.length; i++){
              for(let j = 0; j < row[i].fields.length;j++){
                if(!row[i].fields[j].value){
                  output += ";";
                  continue;
                }
                let field = row[i].fields[j].value;
                try {
                  output += field.replace(/(\r\n|\n|\r)/gm," ") + ";";
                } catch (err){
                  output += field + ";";
                }
              }
            }
            output += "\n";
          }

          let element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
          element.setAttribute('download', "base " + new Date().toDateString() + ".csv");
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

          });
      }

      const generateSections = user => {
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Created On',
                value: formatTime(user.timestamp)
              },{
                name: 'Last Updated',
                value: formatTime(user.lastUpdated)
              },{
                name: 'Confirm By',
                value: formatTime(user.status.confirmBy) || 'N/A'
              },{
                name: 'Status',
                value: user.status.name
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
                value: user.teamCode || 'None'
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
                name: 'School',
                value: user.profile.school
              },{
                name: 'Graduation Year',
                value: user.profile.graduationYear
              },{
                name: 'Major',
                value: user.profile.major
              },{
                name: 'Degree',
                value: user.profile.degree
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
                name: 'Team role',
                value: user.profile.description
              },{
                name: 'Needs Travel Reimbursement',
                value: user.profile.needsReimbursement,
                type: 'boolean'
              },{
                name: 'Needs Accommodation',
                value: user.profile.applyAccommodation,
                type: 'boolean'
              },{
                name: 'Most interesting track',
                value: user.profile.mostInterestingTrack
              },{
                name: 'Occupational status',
                value: user.profile.occupationalStatus.join(', ')
              },{
                name: 'Top level tools',
                value: user.profile.topLevelTools
              },{
                name: 'Great level tools',
                value: user.profile.greatLevelTools
              },{
                name: 'Good level tools',
                value: user.profile.goodLevelTools
              },{
                name: 'Beginner level tools',
                value: user.profile.beginnerLevelTools
              },{
                name: 'Coding experience',
                value: user.profile.codingExperience
              },{
                name: 'Hackathons visited',
                value: user.profile.howManyHackathons
              },{
                name: 'Motivation',
                value: user.profile.essay
              },
            ]
          },{
            name: 'Additional',
            fields: [
              {
                name: 'Portfolio',
                value: user.profile.portfolio
              },
              {
                name: 'Linkedin',
                value: user.profile.linkedin
              },
              {
                name: 'Github',
                value: user.profile.github
              },{
                name: 'Interest in job opportunities',
                value: user.profile.jobOpportunities
              },{
                name: 'Special Needs',
                value: user.confirmation.specialNeeds || 'None'
              },{
                name: 'Previous Junctions',
                value: user.profile.previousJunction.join(', ')
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
                value: user.confirmation.dietaryRestrictions.join(', ')
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
                name: 'State/Province/Region',
                value: user.reimbursement.stateProvinceRegion
              },{
                name: 'A country Of Bank',
                value: user.reimbursement.countryOfBank
              },{
                name: 'Type of Country',
                value: user.reimbursement.countryType
              },{
                name: 'Name Of the Bank',
                value: user.reimbursement.nameOfBank
              },{
                name: 'Address Of the Bank',
                value: user.reimbursement.addressOfBank
              },{
                name: 'Iban',
                value: user.reimbursement.iban
              },{
                name: 'Account Number',
                value: user.reimbursement.accountNumber
              },{
                name: 'Swift / BIC',
                value: user.reimbursement.swiftOrBic
              },{
                name: 'Clearing Code',
                value: user.reimbursement.clearingCode
              },{
                name: 'Brokerage Info',
                value: user.reimbursement.brokerageInfo
              },{
                name: 'Name, Account owner',
                value: user.reimbursement.accountOwnerName
              },{
                name: 'Birthdate, Account owner',
                value: formatTime(user.reimbursement.accountOwnerBirthdate)
              },{
                name: 'Address 1, Account owner',
                value: user.reimbursement.accountOwnerA1
              },{
                name: 'Address 2, Account owner',
                value: user.reimbursement.accountOwnerA2
              },{
                name: 'ZIP, Account owner',
                value: user.reimbursement.accountOwnerZIP
              },{
                name: 'City, Account owner',
                value: user.reimbursement.accountOwnerCity
              },{
                name: 'Country, Account owner',
                value: user.reimbursement.accountOwnerCountry
              },{
                name: 'Additional',
                value: user.reimbursement.additional
              },
            ]
          },
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
                name: 'Nationality',
                value: user.reimbursement.nationality
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
                name: 'State/Province/Region',
                value: user.reimbursement.stateProvinceRegion
              },{
                name: 'A country Of Bank',
                value: user.reimbursement.countryOfBank
              },{
                name: 'Type of Country',
                value: user.reimbursement.countryType
              },{
                name: 'Name Of the Bank',
                value: user.reimbursement.nameOfBank
              },{
                name: 'Address Of the Bank',
                value: user.reimbursement.addressOfBank
              },{
                name: 'Zip Code',
                value: user.reimbursement.zipCode
              },{
                name: 'Iban',
                value: user.reimbursement.iban
              },{
                name: 'Account Number',
                value: user.reimbursement.accountNumber
              },{
                name: 'BBAN',
                value: user.reimbursement.bban
              },{
                name: 'Swift / BIC',
                value: user.reimbursement.swiftOrBic
              },{
                name: 'Clearing Code',
                value: user.reimbursement.clearingCode
              },{
                name: 'Brokerage Info',
                value: user.reimbursement.brokerageInfo
              },{
                name: 'Name, Account owner',
                value: user.reimbursement.accountOwnerName
              },{
                name: 'Birthdate, Account owner',
                value: formatTime(user.reimbursement.accountOwnerBirthdate)
              },{
                name: 'Address 1, Account owner',
                value: user.reimbursement.accountOwnerA1
              },{
                name: 'Address 2, Account owner',
                value: user.reimbursement.accountOwnerA2
              },{
                name: 'ZIP, Account owner',
                value: user.reimbursement.accountOwnerZIP
              },{
                name: 'City, Account owner',
                value: user.reimbursement.accountOwnerCity
              },{
                name: 'Country, Account owner',
                value: user.reimbursement.accountOwnerCountry
              },{
                name: 'Additional',
                value: user.reimbursement.additional
              },
            ]
          },
        ];
      }

      $scope.exportTRCSV = () => {
        UserService
        .getAll()
        .success(data => {
          data = data.filter(user => {
            return user.status.reimbursementApplied;
          })
          let output = "";
          let titles = generateTRSections(data[0]);
           for(let i = 0; i < titles.length; i++){
            for(let j = 0; j < titles[i].fields.length; j++){
              output += titles[i].fields[j].name + ";";
            }
           }
           output += "\n";

          for (let rows = 0; rows < data.length; rows++){
            row = generateTRSections(data[rows]);
            for (let i = 0; i < row.length; i++){
              for(let j = 0; j < row[i].fields.length;j++){
                if(!row[i].fields[j].value){
                  output += ";";
                  continue;
                }
                let field = row[i].fields[j].value;
                try {
                  output += field.replace(/(\r\n|\n|\r)/gm," ") + ";";
                } catch (err){
                  output += field + ";";
                }
              }
            }
            output += "\n";
          }

          let element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
          element.setAttribute('download', "base " + new Date().toDateString() + ".csv");
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

          });
      }

      $scope.selectUser = selectUser;
      $scope.rateUser = rateUser;

    }]);
