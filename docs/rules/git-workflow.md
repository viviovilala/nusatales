# Git Workflow

Branching and collaboration workflow for NusaTales.

## Branch Strategy

- `main`: production-ready code only.
- `dev`: integration branch for approved changes before release.
- `feature/*`: new features and scoped improvements.
- `fix/*`: bug fixes.
- `hotfix/*`: urgent production fixes branched from `main` when necessary.

## Standard Flow

1. Branch from `dev` for normal feature work.
2. Implement code and tests in a focused branch.
3. Open a pull request into `dev`.
4. After verification, merge `dev` into `main` during release.

## Naming Examples

```text
feature/nusamandala-story-api
feature/nusakarya-subscription-flow
fix/auth-token-refresh
hotfix/payment-webhook-timeout
```

## Commit Guidelines

- Use small, reviewable commits.
- Write imperative commit messages.
- Mention the affected domain when useful.

```text
feat: add story listing endpoint for NusaMandala
fix: handle invalid token on community join flow
docs: add deployment checklist for production release
```

## Pull Request Checklist

- [ ] Branch name matches the work type.
- [ ] Commits are clean and understandable.
- [ ] Rebase or merge target branch as needed before final review.
- [ ] Tests pass locally or in CI.
- [ ] Documentation changes are included when applicable.

## Protected Branch Rules

- Do not commit directly to `main`.
- Restrict force-push on `main` and `dev`.
- Require review approval for merge.
- Require CI checks for test and build validation.
