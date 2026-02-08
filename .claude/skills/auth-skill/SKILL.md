---
name: auth-skill
description: Implement secure authentication systems including signup, signin, password hashing, JWT tokens, and Better Auth integration.
---

# Auth Skill – Secure Authentication & Authorization

## Instructions

1. **User Authentication Flows**
   - Implement signup and signin flows
   - Validate user inputs (email, password, OTP)
   - Support logout and session invalidation
   - Handle forgotten password and reset flows

2. **Password Security**
   - Hash passwords using industry standards (bcrypt, argon2)
   - Never store plaintext passwords
   - Enforce strong password rules
   - Use proper salting and cost factors

3. **JWT & Session Management**
   - Generate and verify JWT access tokens
   - Use refresh tokens securely
   - Handle token expiration and rotation
   - Protect routes using middleware/guards

4. **Better Auth Integration**
   - Integrate Better Auth for modern auth workflows
   - Configure providers and callbacks securely
   - Manage user sessions via Better Auth APIs
   - Sync user identity with application database

5. **Authorization**
   - Implement role-based access control (RBAC)
   - Protect sensitive routes and resources
   - Ensure least-privilege access

## Best Practices
- Always hash passwords before storing
- Use HTTPS for all auth-related requests
- Store JWTs securely (httpOnly cookies preferred)
- Prevent common attacks (CSRF, XSS, brute force)
- Centralize auth logic for maintainability
- Log auth events without leaking sensitive data

## Example Structure

### Signup
```ts
const hashedPassword = await bcrypt.hash(password, 12);
await db.user.create({
  email,
  password: hashedPassword,
});
