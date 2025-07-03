# Joke Spark Video Lab
![Screenshot 2025-07-03 at 11 41 33 AM](https://github.com/user-attachments/assets/38051290-c374-4b38-8fcc-069fe6ba8692)

A React-based video generator for creating short-form content. Enter a joke, and the app handles the rest - adding AI-generated audio, captions, and script generation to produce exportable MP4 files ready for your shorts platform.

## Features

- **Joke Input**: Simple interface for entering your joke content
- **AI Audio Generation**: Uses ElevenLabs for natural-sounding voiceovers
- **Smart Captions**: OpenAI generates and formats captions automatically
- **Script Enhancement**: AI improves and structures your content
- **MP4 Export**: Produces ready-to-upload video files for social platforms
- **Modern UI**: Built with shadcn/ui components for a clean, responsive interface

## Installation

```bash
npm install
```

## Usage

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

This is a standard Vite + React + TypeScript setup with:
- Modern UI components from Radix UI
- Tailwind CSS for styling
- Form handling and validation
- Routing capabilities
- Data visualization tools

## API Integrations

- **ElevenLabs**: Audio generation
- **OpenAI**: Caption and script generation

## Repository

[GitHub - joke-spark-video-lab](https://github.com/lalomorales22/joke-spark-video-lab)

---

Built for creating engaging short-form video content with minimal manual work.
