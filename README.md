# DeepSearch 🔍

DeepSearch is a modern web search application that combines the power of multiple AI models to provide comprehensive, well-cited search results. Built with Next.js and Tailwind CSS, it offers a seamless search experience with features like query refinement, smart summarization, and related searches.

## ✨ Features

- **Smart Query Refinement**: Automatically improves search queries for better results
- **Multi-Provider Support**: 
  - OpenAI (GPT-4)
  - DeepSeek
  - Tavily Search API
- **Rich Search Results**:
  - Comprehensive summaries with citations
  - Source links and snippets
  - Image previews when available
  - Related searches
- **Modern UI/UX**:
  - Dark/Light mode support
  - Responsive design
  - Real-time search suggestions
  - Citation hover previews

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for containerized deployment)
- API keys for:
  - OpenAI
  - DeepSeek
  - Tavily

### Local Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/deep-search.git
cd deep-search
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
TAVILY_API_KEY=your_tavily_api_key
```

4. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to start using DeepSearch.

### Docker Installation

1. Clone the repository and create `.env.local` as described above.

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

This will:
- Build the Docker image with Node.js 18
- Set up the environment variables
- Start the container in detached mode
- Map port 3000 to your host machine

3. Access the application at `http://localhost:3000`

To stop the container:
```bash
docker-compose down
```

#### Docker Configuration

The application is containerized using:
- `Dockerfile`: Multi-stage build for optimal image size
- `docker-compose.yml`: Container orchestration with environment variables

Key features of our Docker setup:
- Production-ready Node.js environment
- Automatic environment variable injection
- Volume mounting for local development
- Container health checks
- Automatic restart policy

## 🔧 How It Works

1. **Query Refinement**:
   - User enters a search query
   - Selected AI provider (OpenAI/DeepSeek) refines the query for better results
   - The refined query is used for the actual search

2. **Search Process**:
   - Tavily API performs the web search
   - Results include titles, snippets, URLs, and images
   - Related searches are generated based on results

3. **Summarization**:
   - Selected AI provider analyzes search results
   - Generates a comprehensive summary with citations
   - Formats output in markdown with proper source attribution

4. **Result Display**:
   - Summary with clickable citations
   - Source list with links and snippets
   - Image previews from sources
   - Related search suggestions

## 🎨 UI Components

- **SearchInput**: Main search bar with suggestions
- **SearchResults**: Displays summary and sources
- **Sidebar**: Provider selection and settings
- **FloatingSourcesPanel**: Quick source reference
- **SourcesPreview**: Compact source list view

## 🛠️ Configuration

### API Providers

Configure API providers in `.env.local`:
```env
OPENAI_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
TAVILY_API_KEY=your_key
```

### Search Settings

Customize search behavior in `src/lib/settings-context.tsx`:
- Default provider
- Search depth
- Result count
- Image inclusion

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.