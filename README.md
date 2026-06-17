# Messaging App Server - Complete Backend Implementation

A full-featured messaging server RESTful API built with Node.js and Express with private messaging, group chats, friend management, JWT authentication with refresh tokens, comprehensive testing and input validation.

## Learning Objectives

This project demonstrates mastery of:

- **Complete API Design** - RESTful endpoints for messaging, groups, friends, and user management
- **JWT Authentication** - Access tokens + refresh tokens with rotation
- **Database Relationships** - Complex queries with PostgreSQL (friends, groups, messages)
- **Real-time Features** - Online status, unread counts, last seen tracking
- **Security** - Token validation, route protection, refresh token rotation
- **Testing** - Comprehensive integration tests with Jest and Supertest

## Related Links

- **Frontend Repository**: [https://github.com/leandroesposito/top-messaging-app-front](https://github.com/leandroesposito/top-messaging-app-front)
- **Live Demo**: [https://top-messaging-app-front.netlify.app/](https://top-messaging-app-front.netlify.app/)

## Authentication Overview

### Token System

This application uses a **two-token system** for enhanced security:

| Token Type        | Expiry     | Purpose                    |
| ----------------- | ---------- | -------------------------- |
| **Access Token**  | 15 minutes | Authenticates API requests |
| **Refresh Token** | 7 days     | Obtains new access tokens  |

### Token Flow

```
1. User logs in → Receives accessToken + refreshToken

2. Every API request → Sends accessToken in Authorization header

3. When accessToken expires (15 min) →
   Client sends refreshToken to /api/auth/refresh

4. Server validates refreshToken →
   Issues new accessToken + new refreshToken

5. Old refreshToken is invalidated (one-time use)
```

### Why Two Tokens?

| Aspect              | Access Token      | Refresh Token            |
| ------------------- | ----------------- | ------------------------ |
| **Lifetime**        | Short (15 min)    | Long (7 days)            |
| **Storage**         | Client memory     | Secure storage           |
| **Compromise Risk** | Low (short-lived) | High (long-lived)        |
| **Rotation**        | No                | Yes (new token each use) |

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint    | Purpose                            |
| ------ | ----------- | ---------------------------------- |
| `POST` | `/sign-up`  | Create new account                 |
| `POST` | `/log-in`   | Login → get tokens                 |
| `POST` | `/refresh`  | Refresh tokens                     |
| `POST` | `/log-out`  | Logout (invalidates refresh token) |
| `PUT`  | `/password` | Change password                    |

### Users (`/api/users`)

| Method | Endpoint           | Purpose            |
| ------ | ------------------ | ------------------ |
| `GET`  | `/:userId/profile` | Get user profile   |
| `PUT`  | `/profile`         | Update own profile |
| `PUT`  | `/status`          | Set online status  |

### Friends (`/api/users/friends`)

| Method   | Endpoint       | Purpose                   |
| -------- | -------------- | ------------------------- |
| `GET`    | `/`            | Get friends list          |
| `POST`   | `/:friendCode` | Add friend by friend code |
| `DELETE` | `/:userId`     | Remove friend             |

### Messages (`/api/messages`)

| Method   | Endpoint      | Purpose                                    |
| -------- | ------------- | ------------------------------------------ |
| `GET`    | `/`           | Get all private chats (with unread counts) |
| `GET`    | `/:userId`    | Get chat history with a user               |
| `POST`   | `/:userId`    | Send private message                       |
| `DELETE` | `/:messageId` | Delete own private message                 |

### Groups (`/api/groups`)

| Method   | Endpoint                    | Purpose                                |
| -------- | --------------------------- | -------------------------------------- |
| `GET`    | `/`                         | Get user's groups (with unread counts) |
| `POST`   | `/`                         | Create new group                       |
| `POST`   | `/join/:inviteCode`         | Join group by invite code              |
| `GET`    | `/:groupId`                 | Get group info                         |
| `PUT`    | `/:groupId`                 | Update group (owner only)              |
| `DELETE` | `/:groupId`                 | Delete group (owner only)              |
| `DELETE` | `/:groupId/leave`           | Leave group                            |
| `GET`    | `/:groupId/members`         | Get group members                      |
| `DELETE` | `/:groupId/members/:userId` | Remove member (owner only)             |
| `GET`    | `/:groupId/messages`        | Get group chat                         |
| `POST`   | `/:groupId/messages`        | Send group message                     |
| `DELETE` | `/messages/:messageId`      | Delete own group message               |

## Database Schema

### Core Tables

```sql
-- Users with friend codes and online status
users (
  id INT PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  friend_code TEXT UNIQUE,
  is_online BOOLEAN
)

-- User profiles with display names
profiles (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  public_name TEXT,
  description TEXT
)

-- Friendships (bidirectional, stored with uid1 < uid2)
friends (
  uid1 INT REFERENCES users(id),
  uid2 INT REFERENCES users(id),
  PRIMARY KEY (uid1, uid2),
  CHECK (uid1 < uid2)
)

-- Private messages
private_messages (
  id INT PRIMARY KEY,
  sender_user_id INT REFERENCES users(id),
  receiver_user_id INT REFERENCES users(id),
  created_at TIMESTAMPTZ,
  body TEXT
)

-- Groups with invite codes
groups (
  id INT PRIMARY KEY,
  invite_code TEXT UNIQUE,
  name TEXT,
  description TEXT
)

-- Group memberships
users_groups (
  user_id INT REFERENCES users(id),
  group_id INT REFERENCES groups(id),
  is_owner BOOLEAN,
  last_seen TIMESTAMPTZ,
  PRIMARY KEY (user_id, group_id)
)

-- Group messages
group_messages (
  id INT PRIMARY KEY,
  sender_user_id INT REFERENCES users(id),
  group_id INT REFERENCES groups(id),
  created_at TIMESTAMPTZ,
  body TEXT
)

-- Refresh tokens (for rotation)
refresh_tokens (
  id INT PRIMARY KEY,
  token TEXT UNIQUE,
  user_id INT REFERENCES users(id)
)

-- Private chat last seen tracking
last_seen_private_chat (
  uid1 INT REFERENCES users(id),
  uid2 INT REFERENCES users(id),
  last_seen TIMESTAMPTZ,
  PRIMARY KEY (uid1, uid2)
)
```

### Key Design Decisions

| Decision                | Reasoning                                                |
| ----------------------- | -------------------------------------------------------- |
| **Friend Code**         | Shareable, random identifier instead of exposing user ID |
| **CHECK (uid1 < uid2)** | Prevents duplicate friendships and simplifies queries    |
| **last_seen tracking**  | Enables unread message counts                            |
| **ON DELETE CASCADE**   | Automatic cleanup of related data                        |
| **Refresh token table** | Enables token revocation and rotation                    |

## Complex Query Examples

### Getting Private Chats with Unread Counts

```sql
SELECT
    u.id,
    p.public_name,
    u.is_online,
    MAX(pm.created_at) as last_message_time,
    COALESCE((
        SELECT COUNT(*)
        FROM private_messages pm2
        LEFT JOIN last_seen_private_chat ls
            ON ls.uid1 = $1 AND ls.uid2 = pm2.sender_user_id
        WHERE pm2.receiver_user_id = $1
            AND pm2.sender_user_id = u.id
            AND pm2.created_at > COALESCE(ls.last_seen, '2000-01-01')
    ), 0) as unread_count
FROM users u
JOIN profiles p ON u.id = p.user_id
LEFT JOIN friends f ON (u.id = f.uid1 AND f.uid2 = $1) OR (u.id = f.uid2 AND f.uid1 = $1)
LEFT JOIN private_messages pm ON
    (pm.sender_user_id = u.id AND pm.receiver_user_id = $1) OR
    (pm.receiver_user_id = u.id AND pm.sender_user_id = $1)
WHERE (f.uid1 IS NOT NULL OR pm.id IS NOT NULL) AND u.id != $1
GROUP BY u.id, p.public_name, u.is_online
ORDER BY MAX(pm.created_at) DESC NULLS LAST, unread_count DESC NULLS LAST;
```

### Getting Groups with Unread Counts

```sql
SELECT
    g.id,
    g.name,
    g.invite_code,
    (SELECT COUNT(*)
     FROM group_messages gm
     WHERE gm.group_id = g.id
       AND gm.created_at > ug.last_seen) as unread_count,
    (SELECT MAX(created_at)
     FROM group_messages gm
     WHERE gm.group_id = g.id) as last_message_time
FROM groups g
JOIN users_groups ug ON g.id = ug.group_id
WHERE ug.user_id = $1
ORDER BY unread_count DESC, last_message_time DESC NULLS LAST;
```

### Message Permission Check

```sql
SELECT CASE
    WHEN EXISTS(SELECT 1 FROM friends WHERE uid1 = $1 AND uid2 = $2)
        THEN 'friends'
    WHEN NOT EXISTS(SELECT 1 FROM private_messages
        WHERE sender_user_id = $3 AND receiver_user_id = $4)
        THEN 'first_message'
    ELSE 'blocked'
END AS permission_status;
```

## Request/Response Examples

### Login Request

```http
POST /api/auth/log-in
Content-Type: application/json

{
  "username": "alice123",
  "password": "securepass"
}
```

**Response:**

```json
{
  "id": 1,
  "username": "alice123",
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "friendCode": "ALICE123",
  "publicName": "Alice Johnson",
  "message": "Welcome back Alice Johnson"
}
```

### Send Private Message

```http
POST /api/messages/2
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "body": "Hey Bob, how are you?"
}
```

**Response:**

```json
{
  "message": "success"
}
```

### Get Private Chat

```http
GET /api/messages/2
Authorization: Bearer eyJhbGci...
```

**Response:**

```json
{
  "messages": [
    {
      "id": 1,
      "userId": 1,
      "name": "Alice Johnson",
      "body": "Hey Bob, how are you?",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "userId": 2,
      "name": "Bob Smith",
      "body": "I'm good Alice!",
      "createdAt": "2024-01-15T10:32:00.000Z"
    }
  ]
}
```

### Get Private Chats (With Unread Counts)

```http
GET /api/messages
Authorization: Bearer eyJhbGci...
```

**Response:**

```json
{
  "privateChats": [
    {
      "id": 3,
      "name": "Peter Jones",
      "isOnline": false,
      "lastMessageTime": "2024-01-19T14:05:00.000Z",
      "unreadCount": "1"
    },
    {
      "id": 2,
      "name": "Mary Smith",
      "isOnline": true,
      "lastMessageTime": "2024-01-19T09:15:00.000Z",
      "unreadCount": "0"
    }
  ]
}
```

### Create Group

```http
POST /api/groups
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "name": "Tech Enthusiasts",
  "description": "For all things technology"
}
```

**Response:**

```json
{
  "message": "Group Tech Enthusiasts created successfully"
}
```

### Join Group by Invite Code

```http
POST /api/groups/join/TECH123
Authorization: Bearer eyJhbGci...
```

**Response:**

```json
{
  "message": "Welcome to Tech Enthusiasts group"
}
```

## Testing

### Test Structure

```
tests/
├── sign-up.test.js         # User registration
├── log-in.test.js          # Authentication
├── refresh.test.js         # Token refresh
├── log-out.test.js         # Logout
├── user.test.js            # Profile management
├── friends.test.js         # Friend operations
├── messages.test.js        # Private messages
├── group.test.js           # Group operations
├── user.chats.test.js      # Private chat list
└── user.group.test.js      # Group list
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- sign-up.test.js

# Run with coverage
npm test -- --coverage
```

### Test Example

```javascript
// tests/friends.test.js
describe("Add friend", () => {
  test("add friend with valid friend code", async () => {
    const response = await request(app)
      .post(`/friends/${friendCode}`)
      .set("Authorization", `bearer ${accessToken}`)
      .then((response) => {
        expect(response.status).toEqual(200);
        expect(response.body.message).toContain("added as a friend");
      });
  });

  test("cannot add yourself as friend", async () => {
    const response = await request(app)
      .post(`/friends/${selfFriendCode}`)
      .set("Authorization", `bearer ${accessToken}`)
      .then((response) => {
        expect(response.status).toEqual(409);
        expect(response.body.errors[0]).toEqual(
          "You can't add yourself as a friend",
        );
      });
  });
});
```

## Key Features

### 1. Secure Authentication

- **JWT with refresh tokens** - Short-lived access tokens + rotating refresh tokens
- **Token invalidation** - Refresh tokens are one-time use
- **Multi-device protection** - Using a used refresh token invalidates all tokens for that user
- **Password hashing** - bcrypt with 10 rounds

### 2. Private Messaging

- **First message permission** - Users can send one message before being friends
- **Friend-only chat** - Full chat access requires friendship
- **Unread counts** - Track unread messages per chat
- **Message deletion** - Users can delete their own messages
- **Last seen tracking** - Know when you last viewed a chat

### 3. Group Chat

- **Invite codes** - Shareable join links
- **Owner permissions** - Group owners can delete groups, rename, remove members
- **Unread counts** - Track unread messages per group
- **Member list** - See who's in the group

### 4. Friend System

- **Friend codes** - Shareable identifiers instead of user IDs
- **Bidirectional friendship** - Friendships are mutual
- **Online status** - See if friends are online

### 5. Real-time Indicators

- **Online status** - Users can update their online status
- **Unread counts** - Both private and group chats
- **Last message time** - Show most recent activity

## Security Highlights

### Refresh Token Rotation

```javascript
// When using a refresh token:
// 1. Validate the token
// 2. Delete the used token from database
// 3. Generate and store a new refresh token
// 4. Return new tokens to client

const refresh = [
  validateRefreshToken(),
  async function refresh(req, res) {
    const oldToken = req.body.refreshToken;
    await refreshTokenDB.deleteRefreshToken(oldToken); // One-time use

    const refreshToken = generateRefreshToken(userId);
    await refreshTokenDB.createRefreshToken(refreshToken, userId);

    const accessToken = generateAccessToken(userId);
    res.json({ refreshToken, accessToken });
  },
];
```

### Password Security

```javascript
// Passwords are never stored in plain text
const securePassword = await bcrypt.hash(password, 10);

// Verification uses constant-time comparison
const match = await bcrypt.compare(password, user.password);
```

### Token Validation

```javascript
// JWT Strategy validates token signature and type
const jwtStratety = new Strategy(opts, async (jwtPayload, done) => {
  // Only accept 'access' type tokens
  if (jwtPayload.type !== "access") {
    return done(null, false);
  }

  const user = await userDB.getUserById(jwtPayload.userId);
  done(null, user);
});
```

## Environment Variables

```env
# Server
SERVER_PORT=3000

# Database
DEV_DATABASE_URL=postgresql://user:password@localhost:5432/messaging
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/messaging_test

# JWT
JWT_SECRET=your_super_secret_key_here

# Node Environment
NODE_ENV=development
```

## Project Structure

```
messaging-app-server/
├── index.js                 # Express server
├── auth/                    # Authentication
│   ├── authenticate.js     # JWT verification middleware
│   └── jwt-strategy.js     # Passport JWT strategy
├── controllers/             # Business logic
│   ├── log-in.js           # Login handler
│   ├── sign-up.js          # Registration handler
│   ├── refresh.js          # Token refresh
│   ├── friends.js          # Friend operations
│   ├── messages.js         # Message operations
│   ├── group.js            # Group operations
│   ├── profile.js          # Profile management
│   └── token-generator.js  # JWT generation
├── db/                      # Database layer
│   ├── pool.js             # Connection pool
│   ├── user.js             # User queries
│   ├── friends.js          # Friend queries
│   ├── messages.js         # Message queries
│   ├── group.js            # Group queries
│   └── queries.js          # Shared query utilities
├── routes/                  # Route definitions
├── errors/                  # Custom error classes
└── tests/                   # Integration tests
```

## Running the Project

```bash
# Install dependencies
npm install

# Set up environment variables (.env)
# Create databases (development and test)

# Seed database with sample data
node db/populate.js

# Start development server
node index.js

# Run tests
npm test
```

## What Makes This Project Special

### 1. Complete Feature Set

- Private messaging with friend restrictions
- Group chats with invite codes
- Online status tracking
- Unread message counts
- Profile management
- Password changes

### 2. Robust Security

- Two-token authentication system
- Refresh token rotation
- Password hashing with bcrypt
- Database-level constraints
- Input validation with express-validator

### 3. Database Design

- Self-referential relationships
- Complex join queries with subqueries
- Optimized for unread counts and last seen tracking
- Cascade delete for data integrity

### 4. Production-Ready

- Comprehensive test suite (20+ test files)
- Environment-based configuration
- Error handling middleware
- Database connection pooling

### 5. Clean Architecture

- Separation of concerns (routes, controllers, DB)
- Middleware pattern for validation
- Custom error classes
- Consistent response formats
