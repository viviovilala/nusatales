# API Convention

REST API standards for NusaTales. These rules apply to Laravel controllers, request validation, services, resources, and frontend consumers.

## Principles

- Use REST-oriented resource naming.
- Keep responses consistent across all modules.
- Separate transport concerns from business logic.
- Return safe, structured error messages.
- Version public APIs when contract changes are possible.

## Endpoint Structure

- Prefix API routes with `/api`.
- Use plural resource names.
- Prefer noun-based endpoints over verb-based endpoints.
- Use nested routes only when the relation is explicit and useful.

```text
/api/v1/stories
/api/v1/stories/{story}
/api/v1/communities/{community}/members
/api/v1/creators/{creator}/products
```

## JSON Response Format

Successful responses should follow this structure:

```json
{
  "success": true,
  "message": "Story list retrieved successfully.",
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "per_page": 15,
      "total": 120
    }
  }
}
```

Error responses should follow this structure:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "title": [
      "The title field is required."
    ]
  }
}
```

## Status Code Rules

- `200`: successful read or update.
- `201`: resource created.
- `204`: successful action with no body.
- `400`: malformed request.
- `401`: unauthenticated request.
- `403`: authenticated but forbidden.
- `404`: resource not found.
- `409`: conflict or duplicate state.
- `422`: validation failed.
- `500`: unhandled server error.

## Laravel Implementation Rules

- Validate input with Form Request classes.
- Use API Resources or transformers for response formatting.
- Keep controllers thin and delegate business logic to services or actions.
- Avoid returning raw models directly from controllers.
- Use policies or gates for authorization decisions.

## Domain Naming Guidance

- `NusaMandala`: `stories`, `places`, `maps`, `collections`.
- `NusaLanglang`: `trips`, `events`, `explorations`, `itineraries`.
- `NusaKarya`: `creators`, `products`, `orders`, `subscriptions`.

## Compatibility Checklist

- [ ] Endpoint name is resource-oriented.
- [ ] HTTP method matches the action.
- [ ] Response payload follows the standard contract.
- [ ] Validation errors return `422`.
- [ ] No stack traces or internal exception details are returned.
