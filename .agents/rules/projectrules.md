---
trigger: always_on
---

# Yapakit - Global AI Assistant Rules

## 1. 🌐 Strict Language Policy

- ALL code, variables, comments, commit messages, and documentation MUST be written in professional ENGLISH.
- You may converse with the user in Spanish if they initiate it, but the output artifacts must always be in English.

## 2. 🧠 Context & Objective Preservation

- Yapakit is a Mobile-First, Multi-Tenant SaaS POS & Restaurant OS.
- ALWAYS align your solutions with the B2B Core Focus: Waiter -> Kitchen (KDS) -> Cashier.
- Before suggesting architectural changes or adding new packages, implicitly review `docs/YAPAKIT_CORE_ARCHITECTURE.md` and `docs/TECH_STACK_AND_STRUCTURE.md` to ensure alignment with the established blueprint.

## 3. 🤖 Proactive Automation (No Prompting Required)

- **Auto-Documentation:** Whenever you implement a new feature, modify an existing one, or change a database schema, you MUST automatically update `CHANGELOG.md` and the relevant markdown files in the `docs/` folder. Do NOT wait for the user to ask you to document it.
- **Continuous Alignment:** If you detect that a requested change conflicts with the architecture, warn the user immediately before proceeding.

## 4. 🧪 QA & Functional Testing

- After implementing or modifying any feature, you MUST proactively generate the necessary tests or provide a clear, step-by-step console/manual testing script to verify the basic functionality.
- Never assume the code works perfectly on the first try. Anticipate edge cases.

## 5. 💻 Senior-Level Coding Standards

- **TypeScript:** Strict typing is mandatory. Do not use `any`. Define proper interfaces/types.
- **Clean Code:** Use early returns (Guard Clauses) to avoid deep nesting. Keep functions small and single-responsibility (SOLID principles).
- **Error Handling:** Never swallow errors. Always pass them to the centralized error handler (`next(err)` in Express) or handle them gracefully in the UI with proper user feedback.
- **Performance:** For the React frontend, proactively use memoization (`useMemo`, `useCallback`) where appropriate and strictly separate Server State (React Query) from UI State (Zustand).
