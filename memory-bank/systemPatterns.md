# System Patterns

## Architecture
The application follows the Next.js App Router architecture pattern, with:
- Page components organized in the `/app` directory
- Reusable UI components in the `/components` directory
- Utility functions in `/utils`
- Custom hooks in `/hooks`
- Data models in `/models`
- Context providers in `/contexts`

## Component Structure
- The application uses a feature card pattern to display available tools
- Components are organized by functionality
- UI components leverage Tailwind CSS for styling
- Icons are provided by Heroicons

## State Management
- React's built-in state management (useState, useEffect, etc.) is used
- Category filtering and search functionality implemented at the component level
- Page view tracking appears to be handled via API calls

## Data Flow
1. Features are defined in static arrays in the component
2. User interactions (search, category selection) filter the displayed features
3. Page views are fetched from an API and used to mark popular features
4. Links direct users to the respective feature pages

## Key Implementation Patterns
1. Client-side filtering of features based on user input
2. Semantic search with text normalization for better user experience
3. Multiple caching strategies commented in the code (SWR, React Query, Server-Side Caching)
4. Popular feature highlighting based on view metrics