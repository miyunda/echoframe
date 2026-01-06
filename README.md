# EchoFrame

EchoFrame is a powerful, client-side web application for generating high-quality music visualization videos.

## Features
-   **Client-Side Rendering**: Uses `FFmpeg.wasm` for 1080p video export directly in the browser. No server-side processing keeps your data private.
-   **Audio Visualization**: Real-time frequency analysis and visualization.
-   **LRC Support**: Import `.lrc` lyrics files for synchronized subtitle overlay.
-   **Custom Backgrounds**: Upload your own image for the video background.
-   **Deterministic Shake**: Visual elements react rhythmically to bass frequencies with a stabilized, high-quality shake effect.

## Tech Stack
-   React
-   Vite
-   Tailwind CSS
-   FFmpeg.wasm
-   Lucide React

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment

Designed to be deployed on static hosting services like **Cloudflare Pages**.
1.  Connect your GitHub repository.
2.  Set Build Command: `npm run build`
3.  Set Output Directory: `dist`
