---
name: database-skill
description: Design relational database schemas, create tables, and manage migrations safely and efficiently.
---

# Database Skill – Schema Design & Migrations

## Instructions

1. **Schema Design**
   - Design normalized relational schemas
   - Define primary keys and foreign keys
   - Apply constraints (UNIQUE, NOT NULL, CHECK)
   - Model relationships clearly (one-to-one, one-to-many, many-to-many)

2. **Table Creation**
   - Create tables with appropriate data types
   - Use indexes for frequently queried columns
   - Enforce referential integrity
   - Plan for scalability and future changes

3. **Migrations**
   - Write forward and backward migrations
   - Keep migrations atomic and reversible
   - Apply schema changes incrementally
   - Maintain migration order and consistency across environments

4. **Schema Evolution**
   - Modify existing tables safely
   - Avoid destructive changes when possible
   - Handle data backfills and defaults
   - Version schema changes clearly

## Best Practices
- Prefer explicit schemas over implicit behavior
- Never modify production data without a migration
- Use descriptive table and column names
- Index intentionally, not excessively
- Keep migrations small and reviewable
- Test migrations in staging before production

## Example Structure

### Create Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
