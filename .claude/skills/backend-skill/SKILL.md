---
name: backend-skill
description: Build backend APIs by generating routes, handling requests and responses, and connecting to databases reliably.
---

# Backend Skill – API Routes & Data Access

## Instructions

1. **Route Generation**
   - Define RESTful API routes
   - Use proper HTTP methods (GET, POST, PUT, DELETE)
   - Structure routes logically by resource
   - Apply consistent URL naming conventions

2. **Request & Response Handling**
   - Parse and validate incoming requests
   - Return structured and predictable responses
   - Use correct HTTP status codes
   - Handle errors and edge cases gracefully

3. **Database Connectivity**
   - Establish secure database connections
   - Perform CRUD operations safely
   - Use transactions where necessary
   - Abstract database logic from route handlers

4. **Backend Architecture**
   - Separate routes, services, and data layers
   - Keep business logic out of controllers
   - Reuse shared utilities and helpers
   - Maintain clean and readable code structure

## Best Practices
- Validate all incoming data
- Never trust client input
- Keep routes thin and focused
- Handle errors centrally
- Avoid tight coupling between layers
- Ensure backend code is testable and maintainable

## Example Structure

### Route Definition
```ts
app.post("/users", async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});
