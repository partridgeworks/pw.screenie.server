# Contributing to Screenie

Thank you for your interest in contributing to Screenie! We welcome contributions from the community.

## Ways to Contribute

### 1. Contributing to the Official Site

The preferred way to contribute is by submitting pull requests that will be merged into the official [screenie.org](https://screenie.org) site:

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following the code style guidelines below
5. **Test your changes** locally
6. **Commit your changes**: `git commit -m "Add: description of your feature"`
7. **Push to your fork**: `git push origin feature/your-feature-name`
8. **Open a Pull Request** against the `main` branch

### 2. Self-Hosting

Alternatively, you can self-host your own instance. See the README for self-hosting instructions.

## Code Style Guidelines

Please follow the project's established conventions:

### TypeScript
- Never use `any` as a type - always use the most specific type possible
- Use namespace-scoped imports: `import { something } from "@/lib/..."`

### Components
- Break down large components into smaller, reusable pieces
- Place components in `app/components/` folder
- Use Tailwind CSS utility classes for styling
- Use DaisyUI components where appropriate

### Logging
- Use the logger utility from `@/lib/utils/serverLogger` (server) or `@/app/utils/clientLogger` (client)
- Never use `console.log` directly

### Mongoose Schemas
- Follow the established pattern with explicit interfaces
- Export both the model and frontend-friendly types

For full details, see `.github/copilot-instructions.md`.

## Reporting Issues

- Use GitHub Issues to report bugs or request features
- Include steps to reproduce for bug reports
- Provide context about your environment

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

## Questions?

If you have questions about contributing, feel free to open a discussion on GitHub.
