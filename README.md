# Draw.io AI Studio

Draw.io AI Studio is a Next.js web application that integrates the [Draw.io (diagrams.net)](https://www.draw.io/) editor with Google's Vertex AI Gemini models. It allows users to generate, edit, and visualize diagrams using natural language prompts, complete with real-time XML synchronization and detailed cost tracking.

## Features

- **Draw.io Integration**: Native embedding of the Draw.io editor via iframe, synchronized with a raw XML editor.
- **Gemini AI Generation**: Generate complex diagrams using Google's latest Gemini models (e.g., Gemini 1.5 Pro, Flash, Gemini 3.0).
- **Advanced Prompting**: 
  - Markdown-based editors for prompts and system instructions.
  - Support for image and XML file attachments (Drag & Drop, Paste, or Select).
- **Export to PPTX**: Export your generated diagrams directly to PowerPoint format.
- **Cost & Token Tracking**: Detailed breakdown of token usage (Input, Output, Reasoning/Thinking tokens) and estimated costs.
- **Request Tiers**: Support for Standard, Flex, and Priority request tiers for Vertex AI.
- **Developer Tools**: Integrated Monaco Editor for realtime, two-way bound Draw.io XML editing.
- **Authentication**: Secured via Google Cloud Login (Google Identity Services).

## Tech Stack

- **Framework**: Next.js (Static Export compatible for GitHub/GitLab Pages deployment)
- **UI Architecture**: React, Material UI (MUI)
- **Editors**: `@monaco-editor/react` (for XML), `@uiw/react-md-editor` (for Prompts)
- **AI Integration**: Google Vertex AI REST API
- **Diagramming**: Draw.io Embed API

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Cloud Project with Vertex AI API enabled.
- A Google OAuth Client ID for client-side authentication.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd drawio-ai-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and provide your specific Google Cloud credentials and application settings. Example `.env.local`:
   ```env
   # Google Cloud Configuration
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
   NEXT_PUBLIC_GOOGLE_PROJECT_ID=your-google-project-id
   NEXT_PUBLIC_GOOGLE_REGION=us-central1

   # Auth Configuration
   # Set to 'true' to bypass the Google Login screen when running behind Google Cloud Identity-Aware Proxy (IAP)
   NEXT_PUBLIC_IAP_ENABLED=false

   # Gemini / Vertex AI Configuration
   NEXT_PUBLIC_GEMINI_DEFAULT_MODEL=gemini-2.5-flash

   # Draw.io Configuration
   NEXT_PUBLIC_DRAWIO_BASE_URL=https://embed.diagrams.net/
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Configuration

The application is highly customizable via the `src/config.ts` file. This acts as the central hub for the studio's behavior:

- **Google Cloud & API**: Set your `projectId`, `region`, and `clientId`. Define the `endpointPattern` for the Vertex AI REST API.
- **Models & Pricing**: Add or remove models in the `gemini.models` array, set default models, and configure token pricing per million for standard and priority request tiers.
- **Draw.io Settings**:
  - `baseUrl`: The URL to load the Draw.io editor (default: `https://embed.diagrams.net`).
  - `params`: Modify iframe URL parameters (e.g., `spin`, `proto`, `embed`, `configure`).
  - `libs`: Specify which component libraries load by default (e.g., `general;uml;aws4`).
  - `clibs`: Provide URLs to external/custom library files (`.xml` or `.xml.js`) to load.
  - `defaultStyles`: Define custom XML styles and themes using the Draw.io JSON configuration structure, which will automatically be passed via the `configure` postMessage event.
- **UI Settings**: Adjust sidebar widths, default themes, and other interface values.

### Deployment

This project is configured for strictly static export (`output: 'export'` in `next.config.js`), making it perfect for hosting on GitHub Pages, GitLab Pages, or any static hosting service.

To build the static files:
```bash
npm run build
```
The output will be placed in the `out/` directory.

#### GitLab Pages Deployment

A `.gitlab-ci.yml` file is included to automatically build and deploy the app to GitLab pages when pushed to the `main` branch. 

For the pipeline to work correctly, you must configure the following CI/CD Variables in your GitLab repository (Settings -> CI/CD -> Variables):
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_PROJECT_ID`
- `NEXT_PUBLIC_GOOGLE_REGION`
- `NEXT_PUBLIC_IAP_ENABLED` (optional)
- `NEXT_PUBLIC_GEMINI_DEFAULT_MODEL` (optional)
- `NEXT_PUBLIC_DRAWIO_BASE_URL` (optional)

#### Cloud Run Deployment

This project includes a `Dockerfile` for deployment to Google Cloud Run.

**Important Note on Environment Variables:** Because this is a static build, all `NEXT_PUBLIC_` environment variables must be available at *build time* so they can be embedded into the static static assets. Before building your Docker image, create a `.env.production` file next to your `Dockerfile` substituting in your production values.

##### 1. Build the Docker Image
Replace `[PROJECT_ID]` with your Google Cloud Project ID:
```bash
docker build -t us-central1-docker.pkg.dev/[PROJECT_ID]/solutions/drawio-studio/prod .
```

##### 2. Push to Google Container Registry
```bash
docker push us-central1-docker.pkg.dev/[PROJECT_ID]/solutions/drawio-studio/prod
```

##### 3. Deploy to Cloud Run
```bash
gcloud run deploy drawio-studio `
  --image us-central1-docker.pkg.dev/[PROJECT_ID]/solutions/drawio-studio/prod `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated
```