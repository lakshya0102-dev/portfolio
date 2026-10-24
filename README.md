Personal Portfolio
A responsive personal portfolio showcasing my background, technical skills, projects, and professional links.

Live Portfolio: portfolio-pied-nine-80.vercel.app
GitHub Repository: lakshya0102-dev/portfolio
Preview
<p align="center">
  <img src="https://github.com/user-attachments/assets/7fa4db2b-a7fa-425f-876b-0aee3c1f601b" alt="Personal portfolio homepage preview" width="613" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/67c0cc23-b6df-42ea-bb61-783bb1741bb3" alt="Personal portfolio additional section preview" width="570" />
</p>

Features
- Responsive portfolio layout with sections for About, Skills, and Projects.
- Project cards with descriptions, technology tags, and relevant links.
- Interactive project search to find projects by name, description, or technology.
- Light and dark theme toggle.
- Weather widget for local demonstrations using a weather API.
- AI-assistant interface for local demonstrations using the configured AI API.
- Direct links to GitHub and email contact details.
Note: The weather service and AI assistant are intended for local demonstrations and are not available as fully working API features on the deployed static site.

Tech Stack
- Structure: HTML5
- Styling: CSS3
- Interactivity: JavaScript
- Version Control: Git and GitHub
- Deployment: Vercel
- External APIs for local demos: OpenWeatherMap and Groq
Run Locally
1. Clone the repository:
   git clone https://github.com/lakshya0102-dev/portfolio.git
2. Open the project directory:
   cd portfolio
3. To try the local-demo weather and AI features, copy config.example.js to config.js and replace the placeholders with your own API keys. On Windows PowerShell, use:
   Copy-Item config.example.js config.js
4. Open index.html in your browser, or run a local server for development. For example, with Python:
   python -m http.server 8000
   Then visit http://localhost:8000.
The portfolio's core static content works without API keys. Valid configuration is needed only for the API-powered local-demo features.
Current Limitations
- The site is a static frontend and does not have a backend.
- Project details and portfolio content must be updated manually in the source files.
- The weather widget and AI assistant require configuration and are intended for local demonstrations.
- API keys used in browser-side JavaScript can be exposed to anyone who can access that code. Do not commit config.js or publish real keys; a production deployment should route private API requests through a backend.
- There is no backend-powered contact form; visitors can use the displayed email link.
