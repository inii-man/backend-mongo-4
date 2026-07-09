# Middleware Architecture

This document explains how Express middlewares are used in this application to handle authentication and protect routes.

All custom middlewares are located in [`middlewares/auth.js`](./middlewares/auth.js).

## 1. Global Authentication Check (`checkAuth`)

This middleware is registered globally in `app.js` and intercepts **every single request**. 

**How it works:**
- It uses `passport-jwt` to check if the user has a valid JWT token stored in their cookies.
- If a valid token is found, it extracts the user's profile and attaches it to `req.user` and `res.locals.user`.
- Attaching it to `res.locals.user` makes the `user` object automatically available to all Pug templates. This allows the views to conditionally render elements like the "Logout" button or the user's name.
- **Note:** This middleware **does not block** access. If a user does not have a token (they are a guest), the middleware simply skips attaching the user object and allows the request to proceed.

## 2. Route Protection (`loginRequired`)

This is a strict, route-level middleware used to protect specific actions from unauthenticated users. 

**How it works:**
- It checks if `req.user` exists (which would have been populated by `checkAuth`).
- If `req.user` is missing, it immediately aborts the request and redirects the user to the `/auth/login` page (or returns a `403` JSON error for API requests).

### Where is it currently used?
By default, the application is configured as a public bulletin board where anyone can read posts, but only logged-in users can modify data. The `loginRequired` middleware is applied to the following routes:

- **Creating a post**: `POST /posts`
- **Editing a post**: `POST /posts/:shortId`
- **Deleting a post**: `DELETE /posts/:shortId`
- **Submitting a comment**: `POST /api/posts/:shortId/comments`

*Additionally, the `GET /posts?write=true` route manually implements this check to prevent guests from viewing the post creation form.*

## 3. How to lock down the entire application

If you wish to make the application entirely private (so that guests cannot even view the post list or homepage), you can apply the `loginRequired` middleware globally in `app.js`.

To do this, you would place `app.use(loginRequired)` in `app.js` **after** the `/auth` routes, but **before** the `/posts` routes:

```javascript
// Example modification in app.js:

// Allow public access to authentication pages (login, register)
app.use('/auth', authRouter);

// Block all subsequent routes if not logged in
const { loginRequired } = require('./middlewares/auth');
app.use(loginRequired);

// These routes will now require authentication
app.use('/', indexRouter);
app.use('/posts', postsRouter);
app.use('/api', apiRouter);
```
