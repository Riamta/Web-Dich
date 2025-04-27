# System Patterns

## Architecture
The application follows the Next.js App Router architecture pattern, with:
- Page components organized in the `/src/app` directory
- Reusable UI components in the `/src/components` directory
- Utility functions in `/src/utils`
- Custom hooks in `/src/hooks`
- Data models in `/src/models`
- Context providers in `/src/contexts`
- Constants in `/src/constants`
- Library integrations in `/src/lib`

## Component Structure
- The application uses a feature card pattern to display available tools
- Components are organized by functionality
- UI components leverage Tailwind CSS for styling
- Icons are provided by React Icons
- Modern minimalist design with card-based UI
- Monochromatic gray color scheme across all components

## UI Design System
- Primary color: monochromatic gray palette (gray-50 to gray-900)
- Primary buttons: gray-600 background with white text
- Button hover states: gray-700 background
- Card backgrounds: white with gray-100 hover states
- Borders: gray-200 for subtle separation, gray-300 for emphasis
- Icons: gray-500 for neutral state, gray-600/700 for active/hover states
- Typography: gray-700 for headings, gray-600 for body text, gray-500 for secondary text
- Form elements: white backgrounds with gray-300 borders
- Active/selected states: gray-600 backgrounds with white text
- Consistent rounded-xl corners for containers and rounded-lg for buttons
- Subtle shadows (shadow-md) for card elevation

## State Management
- React's built-in state management (useState, useEffect, etc.) is used
- Category filtering and search functionality implemented at the component level
- Page view tracking is handled via custom hooks and API calls

## Data Flow
1. Features are defined in static arrays in the Features component
2. User interactions (search, category selection) filter the displayed features
3. Page views are fetched from an API and used to mark popular features
4. Links direct users to the respective feature pages

## Multilanguage Implementation
1. Application supports English and Vietnamese languages via a context-based translation system
2. Translation JSON files are stored in `src/constants/translations` (en.json, vi.json)
3. LanguageContext provides language state and translation function via `useLanguage` hook
4. User language preference is stored in localStorage and detected from browser settings
5. LanguageSwitcher component allows users to toggle between available languages
6. All UI text uses the translation function `t()` to support multiple languages
7. Nested keys in translation files provide organized access to translations (e.g., 'translate.title')

## Key Implementation Patterns
1. Client-side filtering of features based on user input
2. Semantic search with text normalization for better user experience
3. Multiple caching strategies commented in the code (SWR, React Query, Server-Side Caching)
4. Popular feature highlighting based on view metrics
5. Responsive design patterns for mobile optimization
6. Clean, modern UI with consistent styling across components
7. Centralized language management with context-based translation system
8. Consistent styling patterns: 
   - Container padding (p-6 to p-8)
   - Spacing between elements (gap-4 to gap-8)
   - Rounded corners (rounded-lg to rounded-xl)
   - Consistent transition effects (transition-colors, duration-150)
   - Gray-based color palette for all UI elements