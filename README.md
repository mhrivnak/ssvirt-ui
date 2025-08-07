# SSVIRT Web UI

A modern React-based web UI for the SSVIRT (Self-Service Virtual Infrastructure Runtime) application using PatternFly components.

## Overview

This application provides a user-friendly interface for managing virtual machines, organizations, and infrastructure resources through a VMware Cloud Director-compatible API.

## Technology Stack

- **Frontend Framework**: React 19+ with TypeScript
- **UI Component Library**: PatternFly 6 (Red Hat's design system)
- **Routing**: React Router v7
- **Build Tool**: Vite
- **Styling**: PatternFly CSS
- **Development Tools**: ESLint, Prettier, TypeScript

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- SSVIRT backend API running (see [SSVIRT backend repository](https://github.com/mhrivnak/ssvirt))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mhrivnak/ssvirt-ui.git
cd ssvirt-ui
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment configuration:
```bash
cp .env.example .env
```

4. Update `.env` with your API endpoint:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

## Container Deployment

### Building the Container Image

Build the container image using Podman (or Docker):
```bash
podman build -t ssvirt-ui .
```

### Running the Container

Run the container, mapping port 8080:
```bash
podman run -d -p 8080:8080 --name ssvirt-ui-container ssvirt-ui
```

The application will be available at `http://localhost:8080`

### Container Runtime Configuration

The application supports runtime configuration by mounting a custom `config.json` file or using environment variables that are processed at container startup.

#### Option 1: Mount a custom config.json file

Create a custom configuration file:
```json
{
  "apiBaseUrl": "http://your-api-server:8080/api",
  "appTitle": "Your Custom Title",
  "appVersion": "1.0.0",
  "logoUrl": "/your-logo.svg"
}
```

Mount it into the container:
```bash
podman run -d -p 8080:8080 \
  -v /path/to/your/config.json:/opt/app-root/src/dist/config.json:ro \
  --name ssvirt-ui-container \
  ssvirt-ui
```

#### Option 2: Use environment variables (processed at startup)

```bash
podman run -d -p 8080:8080 \
  -e API_BASE_URL=http://your-api-server:8080/api \
  -e APP_TITLE="Your Custom Title" \
  --name ssvirt-ui-container \
  ssvirt-ui
```

Available environment variables:
- `API_BASE_URL`: Backend API endpoint URL
- `APP_TITLE`: Application title
- `APP_VERSION`: Application version
- `LOGO_URL`: Logo image URL

### Stopping the Container

```bash
podman stop ssvirt-ui-container
podman rm ssvirt-ui-container
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── forms/           # Form components
│   ├── layouts/         # Page layouts
│   └── tables/          # Data table components
├── pages/               # Page-level components
│   ├── auth/           # Login/logout pages
│   ├── dashboard/      # Main dashboard
│   ├── organizations/  # Organization management
│   ├── vdcs/           # VDC management
│   ├── vms/            # VM management
│   ├── catalogs/       # Template/catalog browsing
│   └── profile/        # User profile
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── contexts/            # React contexts
└── assets/             # Static assets
```

## Development Status

This project is under active development. The implementation is being done in phases:

**Phase 1: Foundation & Authentication** (Current)
- ✅ Project setup with Vite + React + TypeScript
- ✅ PatternFly 6 integration
- ✅ Basic routing structure
- ⏳ Authentication system (Next PR)
- ⏳ Base layout & navigation (Next PR)
- ⏳ API service layer (Next PR)

See [uiplan.md](./uiplan.md) for the complete implementation roadmap.

## API Integration

The application integrates with the SSVIRT backend API. Key endpoints include:

- Authentication: `/api/sessions`
- Organizations: `/api/org`
- VDCs: `/api/vdc/{id}`
- VMs: `/api/vm/{id}`
- Catalogs: `/api/catalog/{id}`

See [uiplan.md](./uiplan.md) for detailed API specifications.

## Contributing

1. Create a feature branch following the pattern: `pr/{number}-{description}`
2. Make your changes following the existing code style
3. Ensure all tests pass: `npm run lint && npm run typecheck && npm run build`
4. Submit a pull request

## License

See [LICENSE](./LICENSE) for details.
