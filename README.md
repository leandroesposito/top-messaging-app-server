# top-messaging-app-server

## Endpoints (/api...)

### /auth

**/sign-up POST**                           Registers new User
**/log-in POST**                            Log in user and gives session token
**/refresh POST**                           Refreshes session token
**/log-out POST**                           Logs out user
**/password PUT**                           Modifies user password (requires old password)

### /users

**/profile PUT**                            Modify Profiles
**/:userID/profile GET**                    Returns User Profile
**/status PUT**                             Sets Online Status
**/friends GET**                            Return Friends
**/friends/:friendCode POST**               Add Friend with Code
**/friends/:userID DELETE**                 Delete friend with UserID

### /groups

**/ POST**                                  Creates Group
**/ GET**                                   Returns all Groups
**/join/:inviteCode POST**                  Joins Group with Invite Code
**/:groupId/leave DELETE**                  Leave Group of Group ID
**/:groupId/members/:userId DELETE**        Bans User of User ID from Groupf of Group ID
**/:groupId/members GET**                   Returns members of Group ID
**/:groupId/messages POST**                 Sends message to Group ID
**/:groupId/messages GET**                  Returns messages from Group ID
**/:groupId GET**                           Returns info of Group ID
**/:groupId DELETE**                        Deletes Group ID
**/:groupId PUT**                           Modifies info of Group

### /messages

**/ GET**                                   Get List of Private Chats
**/:userId POST**                           Sends Private Message to User ID
**/:userId GET**                            Returns History from Private chat with User ID

