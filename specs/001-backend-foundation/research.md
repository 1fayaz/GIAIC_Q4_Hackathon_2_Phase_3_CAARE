# Research: Backend & Database Foundation

**Feature**: 001-backend-foundation
**Date**: 2026-02-06
**Purpose**: Document technology decisions, best practices, and architectural patterns for the backend foundation

## Technology Decisions

### 1. Backend Framework: FastAPI

**Decision**: Use FastAPI 0.109+ as the web framework

**Rationale**:
- **Performance**: Built on Starlette and Pydantic, FastAPI is one of the fastest Python frameworks (comparable to Node.js and Go)
- **Async Support**: Native async/await support essential for I/O-bound operations (database queries)
- **Automatic Documentation**: Built-in OpenAPI (Swagger UI) and ReDoc generation satisfies FR-009
- **Type Safety**: Leverages Python type hints for automatic validation and serialization
- **Developer Experience**: Excellent error messages, intuitive API design, extensive documentation
- **Ecosystem**: Strong integration with SQLModel, Pydantic, and modern Python tooling

**Alternatives Considered**:
- **Flask**: Mature but lacks native async support and automatic API documentation
- **Django REST Framework**: Feature-rich but heavyweight for a simple CRUD API; includes unnecessary ORM (Django ORM)
- **Starlette**: Lower-level than FastAPI; would require manual OpenAPI generation

**Best Practices**:
- Use dependency injection for database sessions (`Depends()`)
- Separate route handlers (thin) from business logic (services)
- Use Pydantic models for request/response validation
- Enable CORS middleware for future frontend integration
- Use async route handlers for all database operations

### 2. ORM: SQLModel

**Decision**: Use SQLModel 0.0.14+ for database modeling and queries

**Rationale**:
- **Unified Models**: Single model definition serves as both SQLAlchemy table and Pydantic schema
- **Type Safety**: Full type hint support with IDE autocomplete
- **FastAPI Integration**: Created by FastAPI author; seamless integration
- **Simplicity**: Reduces boilerplate compared to separate SQLAlchemy + Pydantic models
- **Async Support**: Works with async SQLAlchemy sessions via asyncpg

**Alternatives Considered**:
- **SQLAlchemy alone**: More verbose; requires separate Pydantic models for validation
- **Prisma**: Excellent DX but requires Node.js toolchain; not Python-native
- **Tortoise ORM**: Async-first but less mature ecosystem; weaker type support

**Best Practices**:
- Use `SQLModel` with `table=True` for database models
- Define separate Pydantic models (without `table=True`) for request/response schemas
- Use `Field()` for column constraints (max_length, default values)
- Leverage `Relationship()` for future foreign key relationships
- Use `Optional[]` for nullable fields

### 3. Database Driver: asyncpg

**Decision**: Use asyncpg 0.29+ as the PostgreSQL driver

**Rationale**:
- **Performance**: Fastest PostgreSQL driver for Python (3-5x faster than psycopg2)
- **Async Native**: Built for async/await from the ground up
- **Neon Compatibility**: Fully compatible with Neon Serverless PostgreSQL
- **Connection Pooling**: Built-in connection pool management essential for serverless
- **Type Safety**: Strong typing support for query results

**Alternatives Considered**:
- **psycopg2**: Synchronous; would block event loop in async FastAPI
- **psycopg3**: Async support but newer and less battle-tested than asyncpg

**Best Practices**:
- Configure connection pool size based on Neon limits (default: 10-20 connections)
- Use `create_async_engine()` from SQLAlchemy
- Set appropriate pool timeout and recycle settings for serverless
- Enable connection pool pre-ping to detect stale connections

### 4. Database: Neon Serverless PostgreSQL

**Decision**: Use Neon Serverless PostgreSQL as the database

**Rationale**:
- **Serverless Architecture**: Auto-scaling, pay-per-use pricing model
- **Branching**: Database branching for dev/staging/production environments
- **Performance**: Fast cold starts, connection pooling built-in
- **PostgreSQL Compatibility**: Full PostgreSQL 15+ compatibility
- **Developer Experience**: Easy setup, web console, automatic backups

**Best Practices**:
- Use connection pooling to minimize connection overhead
- Store `DATABASE_URL` in environment variables (never commit)
- Use database branching for development (separate from production)
- Enable SSL connections in production
- Set appropriate statement timeout to prevent long-running queries

### 5. Testing Framework: pytest + pytest-asyncio

**Decision**: Use pytest 8.0+ with pytest-asyncio 0.23+ for testing

**Rationale**:
- **Async Support**: pytest-asyncio enables testing async functions
- **Fixtures**: Powerful fixture system for test database setup/teardown
- **FastAPI Integration**: httpx AsyncClient for testing FastAPI endpoints
- **Ecosystem**: Rich plugin ecosystem (coverage, mocking, etc.)

**Best Practices**:
- Use separate test database (in-memory SQLite or test Neon branch)
- Create fixtures for test client, database session, and test data
- Test both success and error scenarios (404, 400, 500)
- Use `@pytest.mark.asyncio` for async test functions
- Implement integration tests for API endpoints and unit tests for services

## Architectural Patterns

### 1. Layered Architecture

**Pattern**: Separate concerns into distinct layers

**Layers**:
1. **Routes** (`routes/`): HTTP request/response handling, input validation
2. **Services** (`services/`): Business logic, orchestration
3. **Models** (`models/`): Database entities (SQLModel)
4. **Schemas** (`schemas/`): Request/response DTOs (Pydantic)
5. **Core** (`core/`): Infrastructure (database, config)

**Benefits**:
- Clear separation of concerns
- Easier testing (mock dependencies)
- Independent evolution of layers
- Follows constitution principle IV (Separation of Concerns)

### 2. Dependency Injection

**Pattern**: Use FastAPI's `Depends()` for dependency injection

**Usage**:
- Database sessions injected into route handlers
- Services injected into routes
- Configuration injected where needed

**Benefits**:
- Testability (easy to mock dependencies)
- Loose coupling between components
- Explicit dependencies (no hidden globals)

### 3. Repository Pattern (Deferred)

**Decision**: NOT implementing repository pattern in this phase

**Rationale**:
- Constitution principle: "Avoid premature abstractions"
- Simple CRUD operations don't justify additional abstraction layer
- SQLModel queries are already clean and testable
- Can add repository layer later if complexity increases

### 4. Error Handling Strategy

**Pattern**: Centralized error handling with custom exceptions

**Approach**:
- Raise `HTTPException` with appropriate status codes in services
- FastAPI automatically converts to JSON error responses
- Use consistent error response format (per FR-012)

**Error Codes**:
- 400: Validation errors (Pydantic handles automatically)
- 404: Resource not found (task doesn't exist or wrong user_id)
- 500: Unexpected errors (database failures, unhandled exceptions)

## Data Modeling Decisions

### 1. Primary Key Strategy

**Decision**: Use UUID for task IDs

**Rationale**:
- **Scalability**: No central ID generator needed
- **Security**: Non-sequential IDs prevent enumeration attacks
- **Distribution**: Works well in distributed systems
- **Future-Proof**: Easier to merge data from multiple sources

**Alternative**: Auto-incrementing integers (simpler but less secure)

### 2. Timestamp Strategy

**Decision**: Use `datetime` with `default=func.now()` and `onupdate=func.now()`

**Rationale**:
- Database-generated timestamps ensure consistency
- Automatic updates on modification (satisfies FR-007)
- Timezone-aware (use UTC in database)

### 3. User ID Type

**Decision**: Use `str` for user_id (not UUID)

**Rationale**:
- Flexibility for future auth integration (could be email, username, or UUID)
- Spec specifies "string or UUID" - string is more flexible
- Can add validation later when auth is implemented

## Configuration Management

### Environment Variables

**Required**:
- `DATABASE_URL`: Neon PostgreSQL connection string (format: `postgresql+asyncpg://user:pass@host/db`)

**Optional** (for future phases):
- `CORS_ORIGINS`: Allowed origins for CORS (default: `["http://localhost:3000"]`)
- `LOG_LEVEL`: Logging verbosity (default: `INFO`)

**Best Practices**:
- Use `python-dotenv` to load `.env` file in development
- Never commit `.env` to version control (add to `.gitignore`)
- Provide `.env.example` with placeholder values
- Use Pydantic `BaseSettings` for type-safe configuration

## Performance Considerations

### Connection Pooling

**Configuration**:
- Pool size: 10-20 connections (Neon default)
- Max overflow: 5 additional connections
- Pool timeout: 30 seconds
- Pool recycle: 3600 seconds (1 hour)

**Rationale**: Neon Serverless has connection limits; pooling prevents exhaustion

### Query Optimization

**Strategies**:
- Use indexes on `user_id` column (frequent filter)
- Use indexes on `created_at` for sorting
- Avoid N+1 queries (not applicable for single-table CRUD)
- Use `select()` with specific columns if needed (not required for this phase)

### Response Time Targets

- Simple queries (GET by ID): <100ms
- List queries (GET all tasks): <200ms
- Write operations (POST/PUT/DELETE): <300ms
- Overall p95 latency: <500ms

## Security Considerations

### Data Isolation

**Requirement**: All queries MUST filter by user_id (FR-003)

**Implementation**:
- Add `user_id` filter to all SELECT queries
- Verify user_id matches in UPDATE/DELETE operations
- Return 404 (not 403) if task exists but belongs to different user (prevents information leakage)

### Input Validation

**Strategy**:
- Pydantic models validate all inputs automatically
- Add custom validators for business rules (e.g., title length)
- Sanitize user inputs (Pydantic handles this)

### SQL Injection Prevention

**Strategy**:
- SQLModel/SQLAlchemy uses parameterized queries (automatic protection)
- Never construct raw SQL strings with user input

## Future Considerations

### Authentication Integration

**Preparation**:
- `user_id` field already present in Task model (FR-011)
- When auth is added, replace path parameter with JWT token extraction
- No schema changes required

### Scalability

**Considerations**:
- Horizontal scaling: Stateless API design enables multiple instances
- Database scaling: Neon handles this automatically
- Caching: Can add Redis later if needed (not in scope)

### Monitoring

**Future Additions**:
- Structured logging (JSON format)
- Request tracing (correlation IDs)
- Metrics (Prometheus/Grafana)
- Error tracking (Sentry)

## Summary

All technology decisions align with constitution requirements and spec functional requirements. The architecture follows FastAPI best practices with clear separation of concerns. No unresolved questions remain - ready to proceed to Phase 1 (Design).
