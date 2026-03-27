# Role and Objective
You are an Expert Frontend and AI Developer. Your task is to build a Next.js web application that serves as a "Draw.io + Gemini AI Studio." 

# Architectural Constraints
1. **Hosting**: The application must be hostable on GitHub Pages or GitLab Pages. Therefore, it MUST use Next.js Static Export (`output: 'export'` in `next.config.js`). No server-side rendering (SSR) or dynamic Next.js API routes can be used.
2. **Tech Stack**:
   - Next.js (App Router or Pages Router, but strict static export).
   - Material UI (MUI) for all styling, layouts, icons and UI components.
   - Google Identity Services (`@react-oauth/google` or similar) for client-side authentication.
   - `@monaco-editor/react` for XML code editing.
   - A React Markdown editor (e.g., `editor.md`) for prompt editing.
   - Google Vertex AI  (called directly from the client using the OAuth access token).

# Authentication & State Management
- Implement a Google Cloud Login flow.
- The user must log in with a Google Cloud Client ID.
- Upon successful login, persist the OAuth Access Token (e.g., in `localStorage` or session state).
- The app must remain locked behind a login screen until the user is authenticated.
- Use the persisted access token as a Bearer token to authorize calls to the Gemini models (via Vertex AI).

# UI Layout & Features
The main application should feature a flexible layout with a Main Container and Two Sidebars (Left and Right).

## 1. Left Sidebar: Model Configurations
This sidebar controls the AI generation parameters:
- **Prompt Markdown Editor**: A markdown editor for the user's prompt. Include a dropdown to load prepared example prompts fetched from remote static `.md` files (e.g., `/examples/prompt1.md`).
- **System Instructions Markdown Editor**: A markdown editor for system instructions. Include a dropdown to load prepared example instructions fetched from remote static `.md` files.
- **Gemini Model Selector**: A MUI Select component to choose the target model (e.g., `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-3.0-pro`).
- **Thinking Level Selector**: A MUI Select component specifically for Gemini models >= 3 to set the thinking level/budget.
- **Action Button**: A "Generate Diagram" button that sends the prompt and instructions to the selected Gemini model. The prompt should instruct the model to output ONLY valid Draw.io XML.

## 2. Right Sidebar: XML Code Editor
- Embed the Monaco Editor (`@monaco-editor/react`).
- Language should be set to `xml`.
- This editor must display the raw XML of the current Draw.io diagram.
- It must support two-way binding: If Gemini generates new XML, it updates here. If the user edits the XML manually, it should reflect in the Draw.io main view.

## 3. Main Container: Draw.io Editor
- Embed the Draw.io (diagrams.net) editor using an iframe and communicate with it via the standard `postMessage` API.
- Wrap the iframe in a "Studio Controls" header/toolbar.
- **Studio Controls Toolbar**:
  - Buttons to toggle the visibility of the Left and Right sidebars.
  - An "Export to PPTX" button (triggering the Draw.io export action via `postMessage`).
- **System Configuration Input**: Provide a settings modal or text area where the user can input a JSON configuration. This JSON should be injected into the Draw.io iframe initialization parameters to configure the Draw.io UI and load external Draw.io libraries (`urlParams`).
- **Configuration of default libraries** via the JSON configuration input.
- **Configuration of external clibs** via links to remote XML files in the JSON configuration.

# Implementation Steps for the AI
Please implement this application step-by-step:
1. **Project Setup & Auth**: Initialize the Next.js static project, MUI theme, and Google Login screen.
2. **Layout Foundation**: Create the main layout shell with collapsible sidebars using MUI components (e.g., `Drawer`, `Box`, `Grid`).
3. **Integrate Editors**: Add the Markdown editors in the left sidebar and Monaco Editor in the right sidebar. Add fetch logic for the remote `.md` templates.
4. **Draw.io Integration**: Create the `DrawioEmbed` component that handles the iframe loading, `postMessage` listeners (for auto-updating the Monaco XML), and JSON configuration injection.
5. **Gemini API Integration**: Implement the client-side API call to Vertex AI using the user's OAuth token. Route the AI's XML response to the Monaco editor and subsequently to the Draw.io iframe.
6. **Deployment**: Ensure the app builds correctly with `next export` and can be deployed to GitHub Pages and GitLab Pages.