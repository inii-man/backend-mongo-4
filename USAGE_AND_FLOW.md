# Usage & Application Flow

This document explains the comprehensive application flow from both the **End-User Perspective** and the underlying **Technical (System) Perspective**.

---

## 1. Authentication Flow

### 1.1 Local Registration
- **End-User Flow**: The user visits `/auth/register` and fills in their email, name, password, and password confirmation. Client-side JavaScript verifies that passwords match and that length/format rules are met before submission. Upon success, they are redirected to the home page.
- **Technical Flow**: The `POST /auth/register` route receives the payload. It checks the DB for an existing email. If not found, it hashes the password using `crypto.createHash('sha1')` and stores the new user document using Mongoose.

### 1.2 Local Login & JWT
- **End-User Flow**: The user visits `/auth/login` and provides credentials. On success, they return to the home page and see personalized navigation (e.g., "Logout").
- **Technical Flow**: 
  1. The `POST /auth/login` route delegates to `passport.authenticate('local')`.
  2. The Local strategy looks up the user and compares the SHA1 password hash.
  3. If valid, the route handler calls `setUserToken` which generates a JSON Web Token (`jsonwebtoken`) and sets it as an `HttpOnly` cookie.
  4. Subsequent requests pass through the `checkAuth` middleware. It uses `passport-jwt` with a custom `cookieExtractor` to decode the token. If valid, the user object is injected into `req.user` and `res.locals.user` allowing Pug templates to render conditionally.

### 1.3 Google OAuth Login
- **End-User Flow**: The user clicks "Log in with Google" on the login page. They are redirected to Google to authorize the app. Once authorized, they return automatically logged in.
- **Technical Flow**:
  1. `GET /auth/google` triggers `passport.authenticate('google')`.
  2. Google calls back to `/auth/google/callback`.
  3. The Google strategy extracts the `email` and `name`. If the user doesn't exist, a new DB record is created with a random hashed password.
  4. The user is logged in by generating a JWT and setting the cookie, identical to Local Login.

### 1.4 Password Recovery (Nodemailer)
- **End-User Flow**: User clicks "Forgot Password" and submits their email. An email is sent with a temporary 8-digit password. Upon logging in with this temporary password, the user is immediately forced to update their password before proceeding.
- **Technical Flow**: 
  1. The server generates a random 8-digit string using `Math.random()`.
  2. The user document is updated with the new hashed password and a flag `passwordReset: true`.
  3. `nodemailer` connects to Gmail via SMTP and sends the plaintext temporary password.
  4. When the user logs in, the route checks the `passwordReset` flag. If true, it redirects to `/auth/update-password` where a new hash is generated and the flag is cleared.

---

## 2. Bulletin Board (Posts) Flow

### 2.1 Post List & Pagination
- **End-User Flow**: The user navigates to `/posts` and sees a paginated list of posts. They can navigate pages using links at the bottom.
- **Technical Flow**: The `GET /posts` route receives `page` and `perPage` query params. It queries MongoDB using `.find().skip().limit().sort()` to fetch only the needed slice of data. It also uses `.populate('author')` to replace the `author` ObjectId with actual user data. The `totalPage` is calculated to render the Pug pagination mixin.

### 2.2 Post Creation & Validation
- **End-User Flow**: Logged-in users can click "Create Post". They are presented with a form and submit a new post.
- **Technical Flow**: The `GET /posts?write=true` intercepts the request and renders `edit.pug`. The `POST /posts` route handles submission. The `loginRequired` middleware ensures the user is authenticated. The post is saved using the `req.user._id`. A unique `shortId` is generated automatically by `nanoid()` defined in the Mongoose schema.

### 2.3 Modifying & Deleting Posts
- **End-User Flow**: When viewing a post they authored, a user sees "Edit" and "Delete" buttons.
- **Technical Flow**: 
  - **Edit**: Reuses `edit.pug`. The POST update route verifies the post exists and that `post.author._id` matches `req.user._id` before applying `findOneAndUpdate()`.
  - **Delete**: The client sends a `DELETE /posts/:shortId` via `fetch()`. The server verifies ownership and executes `deleteOne()`.

---

## 3. Comments Flow (Client-Side Rendering)

- **End-User Flow**: When viewing a post, comments are loaded asynchronously. The user can type a comment and submit it without the page reloading.
- **Technical Flow**: 
  1. The `view.pug` template contains an empty `<tbody id="comments">` and an HTML `<template>`.
  2. A script immediately calls `fetch('/api/posts/:id/comments')` (Data Asynchronous Call).
  3. The `GET /api/...` route uses Mongoose `populate` on the sub-schema array to inject author names and returns JSON.
  4. The client uses `document.importNode` to clone the template, populate it with data, and append it to the DOM.
  5. Submitting a comment triggers a `POST` fetch request to `/api/...` which uses MongoDB's `$push` operator to add the comment to the array. Upon success, the client re-fetches and re-renders the comment list.

---

## 4. Aggregation Flow

- **End-User Flow**: Not directly exposed via UI, but an API endpoint exists to demonstrate summary statistics.
- **Technical Flow**: A call to `GET /posts/author/:authorId/summary` triggers a MongoDB aggregation pipeline:
  1. `$match`: Filters posts by the specific `authorId`.
  2. `$group`: Groups the matched documents and uses `$sum` to calculate the total post count.
  3. `$lookup`: Performs a "join" with the `users` collection to append author details to the resulting aggregation.
