# BungeeSafeguard Test

This is a repository hosting tests for [BungeeSafeguard](https://github.com/Luluno01/BungeeSafeguard).

## Implemented

- [x] Dumb fuzz
- [x] Test stats
- [ ] State coverage guided test case generation
- [ ] Smoke

## Build

Clone:

```bash
git clone https://github.com/Luluno01/bsgtest.git
```

Build:

```bash
cd bsgtest
npm install
```

To rebuild:

```bash
// Working directory: bsgtest
npm run build
```

## Usage

1. Create a directory `bc` under the desired working directory, or use the one
   in this repository
2. Create a directory `plugins` under `bc` (`bc/plugins`)
3. Put BungeeSafeguard jar in `bc/plugins`
4. Run the test: `node <path/to/bsgtest/build/index.js> [test...]`
