# Security Rules

Baseline security standards for NusaTales across backend API, frontend integration, deployment, and review.

## Security Priorities

- Protect user identity and session state.
- Prevent common web vulnerabilities.
- Minimize sensitive data exposure.
- Keep production defaults hardened.

## Authentication and Authorization

- Use Laravel Sanctum for API authentication when session or token-based auth is required.
- Enforce authorization with policies, gates, or explicit service checks.
- Separate authentication from role or permission decisions.
- Invalidate or rotate tokens when sensitive account actions occur.

## Input and Output Security

- Validate every external input with Laravel Form Requests or equivalent validation layers.
- Escape or sanitize untrusted content before rendering.
- Never trust client-provided role, price, or ownership fields.
- Restrict mass assignment with explicit model fillable or guarded strategy.

## Transport and Infrastructure

- Enforce HTTPS in production.
- Set secure cookie and session configuration.
- Protect `.env`, logs, backups, and storage directories.
- Keep server packages and dependencies updated.

## Common Vulnerabilities To Review

- XSS from user-generated content in community and creator modules.
- SQL Injection from unsafe raw queries.
- CSRF where cookie-based authentication is used.
- IDOR through predictable resource access without authorization checks.
- Rate-limit abuse on login, registration, and monetization endpoints.

## Example Controls

```php
$request->validate([
    'title' => ['required', 'string', 'max:255'],
    'price' => ['nullable', 'numeric', 'min:0'],
]);
```

```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/v1/profile', ProfileController::class);
});
```

## Security Checklist

- [ ] `APP_DEBUG=false` in production.
- [ ] Authentication uses approved Laravel mechanisms.
- [ ] Authorization is enforced on every protected resource.
- [ ] Inputs are validated and outputs are encoded safely.
- [ ] HTTPS is enabled and security headers are reviewed.
- [ ] Dependencies and secrets are managed securely.
