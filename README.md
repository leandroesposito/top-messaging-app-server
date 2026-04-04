# Chat Application API

A RESTful API backend for a real-time chat application built with Node.js and Express. Features secure authentication, private messaging, group chats, and comprehensive input validation.

## Related Links

- **Frontend Repository**: [https://github.com/leandroesposito/top-messaging-app-front](https://github.com/leandroesposito/top-messaging-app-front)
- **Live Demo**: [https://top-messaging-app-front.netlify.app/](https://top-messaging-app-front.netlify.app/)

## Features

- **Secure Authentication**: JWT-based authentication with access/refresh token system
- **Password Protection**: Bcrypt hashing for secure password storage
- **Database**: PostgreSQL with pg driver for reliable data persistence
- **Input Validation**: Express-validator for sanitizing and validating all user inputs
- **Token Management**: Passport.js for seamless authentication middleware
- **Testing**: Comprehensive endpoint testing with Jest and Supertest
- **Real-time Ready**: Database schema designed for real-time messaging features

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **Token Expiration**: Short-lived access tokens minimize attack surface
- **Input Sanitization**: Prevents injection attacks

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, Passport.js, Bcrypt
- **Validation**: Express-validator
- **Testing**: Jest, Supertest

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication (`/auth`)

| Method | Endpoint    | Description                              |
| ------ | ----------- | ---------------------------------------- |
| POST   | `/sign-up`  | Register new user account                |
| POST   | `/log-in`   | Authenticate user and get tokens         |
| POST   | `/refresh`  | Refresh access token using refresh token |
| POST   | `/log-out`  | Invalidate refresh token                 |
| PUT    | `/password` | Change user password                     |

### Users (`/users`)

| Method | Endpoint               | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| PUT    | `/profile`             | Update authenticated user's profile |
| GET    | `/:userId/profile`     | Get user profile by ID              |
| GET    | `/friends`             | Get user's friends list             |
| POST   | `/friends/:friendCode` | Add friend using friend code        |
| DELETE | `/friends/:userId`     | Remove friend by user ID            |
| PUT    | `/status`              | Update online/offline status        |

### Groups (`/groups`)

| Method | Endpoint                    | Description                     |
| ------ | --------------------------- | ------------------------------- |
| POST   | `/`                         | Create new group                |
| GET    | `/`                         | Get authenticated user's groups |
| GET    | `/:groupId`                 | Get group details               |
| PUT    | `/:groupId`                 | Update group name/description   |
| DELETE | `/:groupId`                 | Delete group                    |
| DELETE | `/:groupId/leave`           | Leave group                     |
| GET    | `/:groupId/members`         | Get group members               |
| DELETE | `/:groupId/members/:userId` | Remove member from group        |
| GET    | `/:groupId/messages`        | Get group messages              |
| POST   | `/:groupId/messages`        | Send message to group           |

### Private Messages (`/messages`)

| Method | Endpoint      | Description                         |
| ------ | ------------- | ----------------------------------- |
| GET    | `/`           | Get private chats list              |
| GET    | `/:userId`    | Get conversation with specific user |
| POST   | `/:userId`    | Send private message to user        |
| DELETE | `/:messageId` | Delete private message              |

## Database Schema

The database uses PostgreSQL with the following main tables:

- **users**: User accounts with authentication and status
- **profiles**: User profile information (public name, description)
- **friends**: Friendship relationships between users
- **private_messages**: Direct messages between users
- **groups**: Chat group information
- **users_groups**: Group membership with ownership and last seen tracking
- **group_messages**: Messages sent in groups
- **refresh_tokens**: JWT refresh tokens for authentication
- **last_seen_private_chat**: Track last read timestamps for private conversations

## Authentication Flow

The API implements a two-token authentication system:

1. **Access Token** (15 minutes duration)
   - Short-lived token for API access
   - Stored in memory on client-side

2. **Refresh Token** (7 days duration)
   - Long-lived token for obtaining new access tokens
   - Stored in HTTP-only cookie or secure storage

**Flow**:

1. User logs in → receives both tokens
2. Access token used for API requests
3. When access token expires → use `/auth/refresh` with refresh token
4. Get new access token → continue API calls
5. On logout → refresh token is invalidated

## Testing

Run the test suite using Jest and Supertest:

```bash
npm test
```

Tests cover all API endpoints including:

- Authentication flows
- CRUD operations for users, groups, and messages
- Input validation
- Error handling
- Authorization checks

## Project Structure

```
├── index.js              # Application entry point
├── auth/                 # JWT authentication & passport strategies
├── controllers/          # Request handlers for all endpoints
├── db/                   # PostgreSQL queries & connection
├── errors/               # Custom error classes
├── routes/               # API route definitions
└── tests/                # Jest & Supertest integration tests
```
