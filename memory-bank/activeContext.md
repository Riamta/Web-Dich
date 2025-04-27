# Active Context

## Current Focus
The application is currently focused on the Features component, which acts as the main dashboard for displaying all available tools and utilities to users. This component organizes features into categories, provides search functionality, and highlights popular features based on page views. The application also implements a multilanguage system supporting English and Vietnamese. Recently, new image utility features have been added: background removal and image cropping functionality to expand the utility offerings.

## Recent Changes
- Implementation of the Features component with category filtering
- Search functionality with text normalization for better user experience
- Page view tracking and popular feature highlighting
- Multiple caching strategies for performance optimization
- Multilanguage system with context-based translation function
- Language switcher component with animated dropdown menu
- Browser language detection and persistent language preference
- Added new image background removal tool with API endpoint
- Added new image cropping tool with rotation and scaling functionality
- Updated UI with modern gray-based color scheme across all components

## Key Patterns and Preferences
- Component-based architecture with clear separation of concerns
- Tailwind CSS for styling with consistent design patterns
- Client-side filtering and search for immediate user feedback
- Category-based organization of features
- Popular/Hot badges for features with high page views
- Clean, modern minimalist dashboard UI with card-based components
- Monochromatic gray color scheme (avoiding blue colors)
- Neutral UI with gray-600 for primary buttons and active states
- Soft transitions between gray shades (gray-50 to gray-700)
- Responsive design optimized for mobile devices
- JSON-based translation files with nested keys
- Context API for language state management
- Translation function (t) for all user-facing text
- API routes for special functionality like image processing
- Canvas-based image manipulation for client-side processing
- React-image-crop library integration for image cropping functionality

## UI Styling Guidelines
- Use gray-600 instead of blue-600 for primary buttons and active states
- Use gray-700 instead of blue-700 for hover states on primary elements
- Background colors should primarily be gray-50 for light containers
- Use subtle gray borders (gray-200, gray-300) for container elements
- Interactive elements should use consistent hover transitions
- Forms should maintain a clean, minimalist appearance
- Icons should be gray-500 unless in active state (then gray-600)
- Card-based components with subtle shadows and rounded corners (xl)
- Typography should follow a clear hierarchy with gray-700/800 for headings

## Next Steps
1. Implement or optimize page view tracking with suggested caching strategies (SWR)
2. Consider server-side component approach for better performance
3. Continue development of individual feature pages
4. Implement user authentication for personalized experiences
5. Add more AI-powered tools to the collection
6. Expand translation coverage to all components
7. Consider adding more language options
8. Integrate with professional background removal API service
9. Add more image editing features like filters, adjustments, etc.
10. Ensure consistent gray-based color scheme across all new components

## Active Decisions
- Currently using a basic fetch approach for page views with suggested alternatives
- Using client-side filtering for features with debounced search
- Organizing features into defined categories
- Implementing a consistent card-based UI for all features
- Prioritizing clean layouts, soft gray colors, and simple navigation
- Using a context-based approach for language management
- Detecting browser language on first visit with localStorage persistence
- Using a placeholder API for image background removal in development
- Using client-side canvas manipulation for image cropping
- Adopting a monochromatic gray palette replacing all blue color references