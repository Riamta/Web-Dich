# Story Translator

A modern web application for translating stories using the Gemini AI API. This application is built with Next.js, React, and Tailwind CSS, and is optimized for deployment on Vercel.

## Features

- Clean and intuitive user interface
- Support for text input and file upload (.txt, .docx)
- Multiple target language options
- Context-aware translation to preserve literary style
- Dark mode support
- Download translated text as file
- Responsive design for all devices

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Gemini API key from Google AI Studio

## Setup

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd story-translator
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a \`.env.local\` file in the root directory and add your Gemini API key:
\`\`\`
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The application will be available at http://localhost:3000

## Deployment

This application is optimized for deployment on Vercel. To deploy:

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Add your Gemini API key to the environment variables in Vercel
4. Deploy!

## Usage

1. Enter or upload the text you want to translate
2. Select the target language
3. Choose whether to preserve literary context
4. Click "Translate Story"
5. Download the translated text if desired

## Technologies Used

- Next.js 14
- React 18
- Tailwind CSS
- Google Generative AI (Gemini)
- TypeScript

## License

MIT 