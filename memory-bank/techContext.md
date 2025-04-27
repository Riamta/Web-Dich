# Technical Context

## Technologies Used
- **Next.js 14.1.0**: React framework with App Router
- **React 18.2.0**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase**: Authentication and Firestore database
- **React Icons**: Icon library including various icon sets
- **Framer Motion**: Animation library for smooth UI transitions
- **AI Integrations**: OpenAI, Google AI
- **SWR** (suggested): Data fetching and caching

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
- Mobile responsiveness requires careful design considerations
- Translation system relies on client-side configuration

## Dependencies
The project has numerous dependencies including:
- Firebase for authentication and database
- Google AI/Gen AI for AI functionality
- Chart.js for data visualization
- Various utilities for specific features (qrcode, katex, etc.)
- SWR (suggested) for data fetching
- Framer Motion for animations in UI components like the language switcher

## API Integration
- The application integrates with several external APIs:
  - OpenAI/Google AI for AI-powered features
  - Weather APIs for weather forecasts
  - Currency APIs for exchange rates
  - Firebase for backend services

## Design System
- Modern minimalist design approach
- Card-based UI components for features
- Soft color palette with clean typography
- Light icons and subtle shadows for depth
- Fully responsive design with mobile-first approach

## Multilanguage System
- JSON-based translation files for each supported language (en.json, vi.json)
- Context-provider architecture for language state management
- Dynamic language detection from browser settings
- Persistent language preference via localStorage
- Animated language switcher component with dropdown
- Translation function with nested key support
- Fallback to English when translations are missing