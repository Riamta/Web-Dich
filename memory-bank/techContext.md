# Technical Context

## Technologies Used
- **Next.js 14.1.0**: React framework with App Router
- **React 18.2.0**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase**: Authentication and Firestore database
- **Heroicons**: SVG icon library
- **AI Integrations**: OpenAI, Google AI
- **SWR**: Data fetching and caching

## Development Setup
- Standard Next.js development environment
- `npm run dev` for local development
- `npm run build` for production builds
- `npm run start` to run the production build
- `npm run lint` for linting

## Technical Constraints
- Client-side filtering and search may have performance implications with large feature sets
- API for page views tracking requires proper caching strategy
- Firebase rules need to be configured for proper security

## Dependencies
The project has numerous dependencies including:
- Firebase for authentication and database
- Google AI/Gen AI for AI functionality
- Chart.js for data visualization
- Various utilities for specific features (qrcode, katex, etc.)
- SWR for data fetching

## API Integration
- The application likely integrates with several external APIs:
  - OpenAI/Google AI for AI-powered features
  - Weather APIs for weather forecasts
  - Currency APIs for exchange rates
  - Firebase for backend services