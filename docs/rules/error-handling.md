# Error Handling

Error-handling standards for backend APIs, frontend rendering, and operational flows in NusaTales.

## Objectives

- Keep user-facing errors safe and useful.
- Preserve enough internal detail for debugging.
- Prevent accidental leakage of stack traces, SQL statements, or secrets.

## Backend Rules

- Use centralized exception handling in Laravel.
- Return structured JSON errors for API routes.
- Log unexpected exceptions with contextual metadata.
- Do not expose raw exception messages in production unless explicitly safe.

## Safe API Error Example

```json
{
  "success": false,
  "message": "An unexpected error occurred.",
  "errors": null
}
```

## Validation and Domain Errors

- Validation failures should return `422` with field-level details.
- Authorization failures should return `403`.
- Missing resources should return `404`.
- Domain-specific business conflicts should return `409` when appropriate.

## Frontend Rules

- Show actionable but non-sensitive messages.
- Handle loading, empty, and failure states explicitly.
- Avoid rendering raw server messages directly into the UI without filtering.
- Provide retry paths for network-related failures when practical.

## Logging Guidance

- Log request IDs, authenticated user IDs, route names, and key domain identifiers.
- Mask tokens, passwords, payment details, and secret headers.
- Use log levels intentionally: `info`, `warning`, `error`, `critical`.

## Production Checklist

- [ ] `APP_DEBUG=false`.
- [ ] API responses do not expose stack traces.
- [ ] Logs are stored securely and rotated.
- [ ] Frontend screens handle `401`, `403`, `404`, `422`, and `500`.
- [ ] Monitoring exists for repeated failures in monetization and auth flows.
