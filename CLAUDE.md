# Claude AI Assistant Instructions for Dicionario

## Project Overview
Dicionario is an AI-powered vocabulary learning companion built with Electron, React, and TypeScript.

It provides visual context, intelligent explanations, and example phrases with audio pronunciation for vocabulary words.

## Required Workflow
1. **Always build a plan first** - Use the TodoWrite tool to create a detailed plan before starting any coding work
  - The plan should include low-level details of the actual changes in the code.
2. **Confirm plan with user** - Present the plan and wait for user approval before proceeding
3. **Execute the plan** - Implement changes step by step, updating todo status as you progress
4. **Quality check** - After finishing, ask the user if the changes look good
5. **Commit changes** - Only commit after user approval

## Code Guidance
- DON'T add comments unless explicitely asked too
    - The code should speak for itself
- When creating a new component, check how the current components are written and follow the same conventions.
- Include Unit Tests for all new code introduced.

## Git
- DON'T add that Claude wrote the code in the commit messages
- Each PR should only have one commit, if you need to make changes, amend the latest commit

## Project Structure
```
src/
├── main/               # Electron main process
│   ├── main.ts        # Application entry point
│   ├── preload.ts     # IPC bridge
│   └── services/      # Backend services
│       ├── database.ts # SQLite operations
│       ├── search.ts   # Image search & LLM integration
│       ├── tts.ts      # Text-to-speech service
│       └── providers/  # API providers (OpenAI, Google, etc.)
├── renderer/          # React frontend
│   ├── components/    # UI components
│   ├── App.tsx       # Main app component
│   ├── main.tsx      # React entry point
│   └── utils/        # Frontend utilities
├── shared/           # Shared types and utilities
│   └── types.ts      # TypeScript interfaces
└── test/            # Unit tests
    ├── components/  # Component tests
    └── services/    # Service tests
```

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
