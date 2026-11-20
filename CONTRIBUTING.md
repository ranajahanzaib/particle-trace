# Contributing to Particle Trace

Thank you for your interest in contributing to **Particle Trace**! We welcome contributions from high-energy physicists, students, scientific software engineers, and web developers.

---

## Code of Conduct

This project and everyone participating in it is governed by the [Particle Trace Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Development Workflow

### 1. Fork and Clone the Repository

```bash
git clone https://github.com/ranajahanzaib/particle-trace.git
cd particle-trace
```

### 2. Install Dependencies

```bash
# Install frontend packages
pnpm install

# Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -e pipeline/
```

### 3. Run Locally in Demo Mode

```bash
# Start local Vite development server
pnpm dev
```

Open `http://localhost:3000` to interact with the scientific workspace.

### 4. Running Tests

All contributions must include appropriate unit or integration tests:

```bash
# Run all frontend and API tests
pnpm test

# Run all Python physics pipeline tests
pnpm test:pipeline

# Validate dataset bundle integrity
pnpm pipeline:validate
```

### 5. Build for Production

Ensure that TypeScript type checks and Vite bundle packaging pass cleanly:

```bash
pnpm build
```

---

## Scientific Guidelines & Principles

1. **Physical Correctness**: Never fabricate detector measurements, matching confidence scores, or physical relationships. Derived quantities must strictly follow standard physics formulas documented in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
2. **64-bit Integer Safety**: Particle IDs and parent references must always be handled as decimal strings in JavaScript and TypeScript.
3. **Data Integrity**: Validate parallel list lengths, referential integrity, and energy bounds before committing changes to data schemas.
4. **Detector Geometry**: Keep 3D visualization layers scientifically honest. Clearly distinguish detector measurement positions from true pre-digitization positions and schematic geometry.

---

## Submitting Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, concise commit messages.
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request on GitHub against the `main` branch. Describe the rationale for the change and reference any relevant issues.
