# Contributing to Yapakit

Thank you for your interest in contributing to Yapakit! We welcome all contributions that help improve our Mobile-First, Multi-Tenant SaaS POS & Restaurant OS.

## 📜 Principles

- **Professional English:** All code, variables, comments, commit messages, and documentation must be written in professional English.
- **Clean Code:** We follow SOLID principles. Keep functions small and focused.
- **Strict Typing:** Use TypeScript strictly. Avoid `any`. Define proper interfaces and types.
- **Guard Clauses:** Prefer early returns over deep nesting.

## 🛠️ Getting Started

1. **Fork the repository** and create your branch from `main`.
2. **Set up your environment** by copying the `.env.example` files in both `client` and `server` directories to `.env`.
3. **Install dependencies** using `npm install` in both directories.
4. **Follow the [Developer Guide](./DEVELOPER_GUIDE.md)** for detailed setup and seeding demo data.

## 🚀 Development Workflow

1. **Self-Documentation:** If you add a feature or change a schema, update the relevant files in the `docs/` folder and the `CHANGELOG.md`.
2. **Automated Checks:** Ensure your code passes linting and type checks (`npm run tsc` in the client).
3. **Manual Testing:** Provide a clear, step-by-step testing script in your Pull Request description.

## 📬 Pull Request Process

1. Ensure your code is formatted and lint-free.
2. Update the README or documentation if you've added new functionality.
3. Link any relevant issues in your PR description.
4. Once your PR is approved and passes all checks, it will be merged into the `main` branch.

---
*Company Confidential - Kodffe / Yapakit Technology Group*
