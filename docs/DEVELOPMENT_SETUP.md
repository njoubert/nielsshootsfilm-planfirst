## Phase 1.5: Developer Experience & Code Quality (Week 1-2)

**Philosophy**: Automate code quality checks to maintain consistency across the polyglot codebase.

### 1.5.1 Pre-commit Hooks Setup

**Framework**: [pre-commit](https://pre-commit.com/) - Git hook manager

#### Installation

```bash
# Install pre-commit (Python-based)
pip install pre-commit

# Or via brew on macOS
brew install pre-commit

# Install git hook scripts
pre-commit install
```

#### Configuration File: `.pre-commit-config.yaml`

```yaml
# Pre-commit hooks configuration
# See https://pre-commit.com for more information

default_language_version:
  python: python3.11
  node: system

repos:
  # ====================
  # General / Multi-language
  # ====================
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      # Prevent committing large files
      - id: check-added-large-files
        args: ['--maxkb=1000']
      # Check for files that would conflict on case-insensitive filesystems
      - id: check-case-conflict
      # Check for merge conflicts
      - id: check-merge-conflict
      # Check JSON files
      - id: check-json
      # Check YAML files
      - id: check-yaml
        args: ['--unsafe'] # Allow custom YAML tags
      # Detect private keys
      - id: detect-private-key
      # Fix end of files
      - id: end-of-file-fixer
      # Fix trailing whitespace
      - id: trailing-whitespace
        args: [--markdown-linebreak-ext=md]
      # Prevent committing to main
      - id: no-commit-to-branch
        args: ['--branch', 'main', '--branch', 'master']

  # ====================
  # Secrets Detection
  # ====================
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package-lock.json

  # ====================
  # TypeScript / JavaScript
  # ====================
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.(js|ts)$
        types: [file]
        args:
          - --fix
        additional_dependencies:
          - eslint@8.56.0
          - '@typescript-eslint/parser@6.19.0'
          - '@typescript-eslint/eslint-plugin@6.19.0'
          - 'eslint-plugin-lit@1.11.0'

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        files: \.(js|ts|json|yaml|yml|md|html|css)$
        args:
          - --write
          - --ignore-unknown

  # ====================
  # Go
  # ====================
  - repo: https://github.com/dnephin/pre-commit-golang
    rev: v0.5.1
    hooks:
      # Format Go code
      - id: go-fmt
        args: [-w]
      # Organize imports
      - id: go-imports
      # Run go vet
      - id: go-vet
      # Run golangci-lint (comprehensive linter)
      - id: golangci-lint
        args: ['--fix']
      # Check go.mod is tidy
      - id: go-mod-tidy

  # ====================
  # Bazel
  # ====================
  - repo: https://github.com/keith/pre-commit-buildifier
    rev: 6.4.0
    hooks:
      - id: buildifier
        args: [--lint=fix]
      - id: buildifier-lint

  # ====================
  # Markdown / Documentation
  # ====================
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.38.0
    hooks:
      - id: markdownlint
        args: ['--fix']

  # ====================
  # Shell scripts
  # ====================
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck

  # ====================
  # Commitlint (optional - enforce commit message format)
  # ====================
  - repo: https://github.com/alessandrojcm/commitlint-pre-commit-hook
    rev: v9.11.0
    hooks:
      - id: commitlint
        stages: [commit-msg]
        additional_dependencies: ['@commitlint/config-conventional']

  # Local hooks for custom checks
  - repo: local
    hooks:
      # Run fast unit tests before commit
      - id: frontend-unit-tests
        name: Frontend Unit Tests
        entry: bash -c 'cd frontend && npm run test:ci'
        language: system
        pass_filenames: false
        stages: [push] # Only on push, not every commit

      - id: go-unit-tests
        name: Go Unit Tests
        entry: bash -c 'cd backend && go test -short ./...'
        language: system
        pass_filenames: false
        stages: [push] # Only on push, not every commit
```

#### Secrets Baseline Setup

```bash
# Generate initial secrets baseline (will detect existing secrets)
detect-secrets scan > .secrets.baseline

# Audit the baseline (mark false positives)
detect-secrets audit .secrets.baseline
```

---

### 1.5.2 Language-Specific Tools

#### TypeScript / JavaScript

**ESLint** - Linting

```json
// frontend/.eslintrc.json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "lit"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:lit/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**Prettier** - Formatting

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

```
// .prettierignore
node_modules/
dist/
build/
bazel-*
*.min.js
package-lock.json
```

**TypeScript Config**

```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Package Scripts**

```json
// frontend/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ci": "vitest run",
    "test:watch": "vitest watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write 'src/**/*.{ts,css,html}'",
    "format:check": "prettier --check 'src/**/*.{ts,css,html}'",
    "type-check": "tsc --noEmit"
  }
}
```

#### Go

**golangci-lint** - Comprehensive Go linter

```yaml
# .golangci.yml
run:
  timeout: 5m
  tests: true

linters:
  enable:
    - gofmt # Format code
    - goimports # Organize imports
    - govet # Vet examines Go source code
    - errcheck # Check for unchecked errors
    - staticcheck # Static analysis
    - unused # Check for unused code
    - gosimple # Simplify code
    - ineffassign # Detect ineffectual assignments
    - typecheck # Type checking
    - gocritic # Opinionated Go linter
    - misspell # Spell check
    - gosec # Security checks
    - dupl # Duplicate code detection
    - godot # Check comments end with period
    - gocyclo # Cyclomatic complexity

linters-settings:
  gocyclo:
    min-complexity: 15
  gocritic:
    enabled-tags:
      - diagnostic
      - experimental
      - opinionated
      - performance
      - style

issues:
  exclude-rules:
    # Exclude test files from some checks
    - path: _test\.go
      linters:
        - dupl
        - gosec
```

**Go Formatting**

```bash
# Format all Go files
gofmt -w .

# Organize imports
goimports -w .

# Run golangci-lint
golangci-lint run --fix
```

---

### 1.5.3 VS Code Configuration

#### Workspace Settings

```json
// .vscode/settings.json
{
  // General
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.eol": "\n",

  // TypeScript / JavaScript
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.rulers": [100]
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // Go
  "[go]": {
    "editor.defaultFormatter": "golang.go",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  },
  "go.lintTool": "golangci-lint",
  "go.lintFlags": ["--fast"],
  "go.useLanguageServer": true,
  "gopls": {
    "ui.semanticTokens": true,
    "ui.completion.usePlaceholders": true
  },

  // Bazel
  "[bazel]": {
    "editor.defaultFormatter": "BazelBuild.vscode-bazel"
  },

  // Markdown
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.wordWrap": "on"
  },

  // File associations
  "files.associations": {
    "BUILD": "bazel",
    "*.BUILD": "bazel",
    "WORKSPACE": "bazel",
    ".bazelrc": "shellscript"
  },

  // Search exclusions
  "search.exclude": {
    "**/node_modules": true,
    "**/bazel-*": true,
    "**/dist": true,
    "**/build": true
  },

  // File exclusions
  "files.exclude": {
    "**/bazel-*": true
  }
}
```

#### Recommended Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    // TypeScript / JavaScript
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "runem.lit-plugin",

    // Go
    "golang.go",

    // Bazel
    "BazelBuild.vscode-bazel",

    // Testing
    "ZixuanChen.vitest-explorer",
    "ms-playwright.playwright",

    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",

    // Markdown
    "yzhang.markdown-all-in-one",
    "DavidAnson.vscode-markdownlint",

    // General
    "EditorConfig.EditorConfig",
    "streetsidesoftware.code-spell-checker",
    "christian-kohler.path-intellisense",
    "wayou.vscode-todo-highlight",

    // Security
    "Equinusocio.vsc-material-theme-icons"
  ]
}
```

#### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Frontend Dev Server",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    },
    {
      "name": "Go Admin Server",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/admin",
      "cwd": "${workspaceFolder}",
      "env": {
        "DATA_DIR": "${workspaceFolder}/data",
        "STATIC_DIR": "${workspaceFolder}/static"
      }
    },
    {
      "name": "Run Frontend Tests",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal"
    },
    {
      "name": "Run Go Tests",
      "type": "go",
      "request": "launch",
      "mode": "test",
      "program": "${workspaceFolder}/backend"
    }
  ],
  "compounds": [
    {
      "name": "Full Stack",
      "configurations": ["Frontend Dev Server", "Go Admin Server"]
    }
  ]
}
```

---

### 1.5.4 EditorConfig

```ini
# .editorconfig
# EditorConfig helps maintain consistent coding styles across editors

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,ts,json,yaml,yml}]
indent_style = space
indent_size = 2

[*.go]
indent_style = tab
indent_size = 4

[*.{md,markdown}]
trim_trailing_whitespace = false

[*.py]
indent_style = space
indent_size = 4

[BUILD,*.bazel,*.bzl,WORKSPACE]
indent_style = space
indent_size = 4

[Makefile]
indent_style = tab
```

---

### 1.5.5 Secrets Management

**Tools**:

- **detect-secrets**: Prevent committing secrets
- **.env files**: For local development (gitignored)
- **Bazel secrets**: Never commit secrets to BUILD files

#### .gitignore

```
# Dependencies
node_modules/
frontend/node_modules/

# Build outputs
dist/
build/
bazel-*/

# Environment variables
.env
.env.local
.env.*.local
*.env

# Secrets
*.pem
*.key
*.cert
credentials.json
secrets.yaml

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
*.coverage

# Logs
*.log
logs/

# Uploaded content (for local dev)
static/uploads/*
!static/uploads/.gitkeep

# Data files (for local dev)
data/*.json
!data/.gitkeep
```

#### Environment Variables Template

```bash
# .env.example (commit this)
# Copy to .env and fill in values

# Admin authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# Server configuration
PORT=8080
HOST=localhost

# File paths
DATA_DIR=./data
STATIC_DIR=./static

# Development mode
DEV_MODE=true

# Session secret (generate with: openssl rand -hex 32)
SESSION_SECRET=your-secret-key-here
```

---

### 1.5.6 Developer Workflow

#### First-time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd nielsshootsfilm-playground

# 2. Install pre-commit
pip install pre-commit
pre-commit install

# 3. Setup secrets baseline
detect-secrets scan > .secrets.baseline

# 4. Install frontend dependencies
cd frontend
npm install

# 5. Install Go dependencies
cd ../backend
go mod download

# 6. Copy environment file
cp .env.example .env
# Edit .env with your values

# 7. Initialize data files
bazel run //:init_data

# 8. Run pre-commit on all files (optional)
pre-commit run --all-files
```

#### Daily Development

```bash
# Start development servers
bazel run //frontend:dev_server  # Terminal 1
bazel run //backend:admin_server # Terminal 2

# Or use VS Code compound launch configuration
# Debug -> "Full Stack"

# Before committing
npm run lint:fix             # Fix linting issues
npm run format               # Format code
npm run test:ci              # Run tests

# Commit (pre-commit hooks run automatically)
git add .
git commit -m "feat: add photo upload feature"
git push
```

#### Manual Checks

```bash
# Run all linters manually
cd frontend && npm run lint
cd backend && golangci-lint run

# Format all code
cd frontend && npm run format
cd backend && gofmt -w . && goimports -w .

# Run tests
bazel test //...

# Check for secrets
detect-secrets scan --baseline .secrets.baseline

# Run pre-commit hooks manually
pre-commit run --all-files
```

---

### 1.5.7 Bazel Integration

**Run pre-commit checks via Bazel**:

```python
# //BUILD.bazel

sh_test(
    name = "pre_commit_check",
    srcs = ["scripts/pre_commit_check.sh"],
    tags = ["lint", "format"],
)

# Run all linters
sh_test(
    name = "lint_all",
    srcs = ["scripts/lint_all.sh"],
    tags = ["lint"],
)
```

```bash
# scripts/pre_commit_check.sh
#!/bin/bash
set -e

echo "Running pre-commit checks..."
pre-commit run --all-files

echo "All checks passed!"
```

**CI Integration**:

```bash
# Run in CI
bazel test //:pre_commit_check
bazel test //:lint_all
```

---

### 1.5.8 Commit Message Convention

**Format**: Using [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```
feat(albums): add password protection for client galleries

Implements bcrypt-based password protection for albums with
visibility set to 'password_protected'.

Closes #123

---

fix(image-processing): correct 4K display image dimensions

Changed display image size from 1920px to 3840px for 4K displays.

---

test(photo-lightbox): add keyboard navigation tests

Adds tests for arrow key navigation and ESC key closing.
```

**Commitlint Config**:

```js
// .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert',
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
  },
};
```

---

### 1.5.9 Code Review Checklist

Before requesting review:

- [ ] All pre-commit hooks pass
- [ ] Code is formatted (Prettier for TS, gofmt for Go)
- [ ] All linters pass (ESLint, golangci-lint)
- [ ] Tests written and passing
- [ ] No secrets committed (detect-secrets)
- [ ] Conventional commit messages
- [ ] Documentation updated if needed
- [ ] Manual testing completed

---
