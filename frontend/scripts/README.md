# Frontend Scripts

Organized scripts for frontend development tasks.

## Available Scripts

### Development

- **`dev.sh`** - Start Vite development server with hot module replacement

  ```bash
  ./frontend/scripts/dev.sh
  ```

### Building

- **`build.sh`** - Build frontend for production (TypeScript compilation + Vite build)

  ```bash
  ./frontend/scripts/build.sh
  ```

### Testing

- **`test.sh`** - Run all frontend unit tests (Vitest) in CI mode

  ```bash
  ./frontend/scripts/test.sh
  ```

- **`test-watch.sh`** - Run tests in watch mode for development

  ```bash
  ./frontend/scripts/test-watch.sh
  ```

### Code Quality

- **`typecheck.sh`** - Type-check TypeScript without emitting files

  ```bash
  ./frontend/scripts/typecheck.sh
  ```

- **`lint.sh`** - Lint TypeScript/JavaScript files with ESLint

  ```bash
  ./frontend/scripts/lint.sh
  ```

- **`format.sh`** - Format code with Prettier

  ```bash
  ./frontend/scripts/format.sh
  ```

## npm Scripts

All scripts are thin wrappers around npm scripts defined in `package.json`. You can also run them directly:

```bash
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run test:ci    # Run tests
npm run typecheck  # Type checking
npm run lint       # Linting
npm run format     # Formatting
```
