## Project Overview
Dicionario is an AI-powered vocabulary learning companion built with Electron, React, and TypeScript.

It provides visual context, intelligent explanations, and example phrases with audio pronunciation for vocabulary words.

## Code Guidance
- DON'T add comments unless explicitely asked too
    - The code should speak for itself
- When creating a new component, check how the current components are written and follow the same conventions.
- Include Unit Tests for all new code introduced.

## Development Commands
- `npm run dev` - Start development server (both main and renderer processes)
- `npm run build` - Build for production
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Open Vitest UI
- `npm run format` - Format code with Prettier
- `npm run pack` - Create distributable packages

## Code Quality Requirements
Before committing any changes, always run:
1. `npm run format` - Format code with Prettier
2. `npm run build` - Ensure code builds successfully
3. `npm run test` - Ensure all tests pass

## Technology Stack
- **Framework**: Electron with React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Testing**: Vitest with Testing Library
- **Database**: SQLite with sql.js
- **API Integrations**: OpenAI GPT-4o-mini, Google APIs, DuckDuckGo, Pixabay
- **Audio**: Google Cloud TTS with Web Speech API fallback

## Code Style Guidelines
- Use functional components with React hooks
- Follow TypeScript strict mode conventions
- Use Tailwind CSS for styling (no custom CSS unless necessary)
- Write comprehensive unit tests for new features
- Use descriptive variable and function names
- Prefer composition over inheritance
- Keep components small and focused

## API Configuration
The app supports multiple API providers configurable through settings:
- OpenAI API for explanations and phrase generation
- Google Custom Search API for high-quality images
- Google Cloud TTS for premium audio

## Testing Strategy
- Unit tests for all components and services
- Mock external API calls in tests
- Test keyboard navigation and user interactions
- Verify database operations
- Ensure accessibility compliance

## Important Notes
- Always preserve existing functionality when making changes
- Maintain compatibility with the current database schema
- Keep API keys secure and configurable through settings
- Ensure proper error handling for network requests
- Follow the existing component patterns and conventions

## CRITICAL: Use ripgrep, not grep

NEVER use grep for project-wide searches (slow, ignores .gitignore). ALWAYS use rg.

- `rg "pattern"` — search content
- `rg --files | rg "name"` — find files
- `rg -t python "def"` — language filters

## File finding

- Prefer `fd` (or `fdfind` on Debian/Ubuntu). Respects .gitignore.

## JSON

- Use `jq` for parsing and transformations.
