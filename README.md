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

The application supports runtime configuration by mounting a custom `config.json` file:

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

Configuration options in the JSON file:
- `apiBaseUrl`: Backend API endpoint URL
- `appTitle`: Application title
- `appVersion`: Application version
- `logoUrl`: Logo image URL

### Stopping the Container

```bash
podman stop ssvirt-ui-container
podman rm ssvirt-ui-container
```

## Kubernetes/OpenShift Deployment

The application can be deployed to Kubernetes or OpenShift using the provided manifests.

### Prerequisites

- Access to a Kubernetes cluster (OpenShift 4.x or Kubernetes 1.20+)
- `kubectl` or `oc` CLI tool configured
- The SSVIRT backend API deployed and accessible within the cluster

### Quick Deployment

Deploy using the provided Kubernetes manifests:

```bash
# Using kustomize (recommended)
kubectl apply -k k8s/

# Or apply individual manifests explicitly
kubectl apply -f k8s/configmap.yaml -f k8s/deployment.yaml
```

This will create:
- **Deployment**: 2 replicas of the SSVIRT UI using `quay.io/mhrivnak/ssvirt-ui:latest`
- **Service**: ClusterIP service exposing port 8080
- **Route** (OpenShift): HTTPS route with edge termination
- **ConfigMap**: Configuration for runtime customization

### Accessing the Application

#### On OpenShift
The application will be accessible via the created Route:

```bash
# Get the route URL
oc get route ssvirt-ui -o jsonpath='{.spec.host}'
```

#### On Standard Kubernetes
For non-OpenShift clusters, uncomment and configure the Ingress section in `k8s/deployment.yaml`, or use port forwarding for testing:

```bash
# Port forward for testing
kubectl port-forward svc/ssvirt-ui 8080:8080

# Access at http://localhost:8080
```

### Configuration

The deployment uses a config.json file mounted from a ConfigMap:

```yaml
volumes:
- name: config-volume
  configMap:
    name: ssvirt-ui-config
volumeMounts:
- name: config-volume
  mountPath: /opt/app-root/src/dist/config.json
  subPath: config.json
  readOnly: true
```

Edit the ConfigMap to match your environment:

```bash
kubectl edit configmap ssvirt-ui-config
```

The ConfigMap contains a config.json file with these options:
- `apiBaseUrl`: Backend API endpoint URL (default: "http://ssvirt-backend:8080/api")
- `appTitle`: Application title (default: "SSVIRT Web UI")
- `appVersion`: Application version (default: "1.0.0")
- `logoUrl`: Logo image URL (default: "/vite.svg")

### Customization Examples

#### Scale the deployment:
```bash
kubectl scale deployment ssvirt-ui --replicas=3
```

#### Update the image:
```bash
kubectl set image deployment/ssvirt-ui ssvirt-ui=quay.io/mhrivnak/ssvirt-ui:v1.2.0
```

#### Using Kustomize for environment-specific deployments:
```bash
# Create overlays for different environments
mkdir -p k8s/overlays/production
cat > k8s/overlays/production/kustomization.yaml << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../

patchesStrategicMerge:
- deployment-patch.yaml

images:
- name: quay.io/mhrivnak/ssvirt-ui
  newTag: v1.0.0
EOF

# Apply production configuration
kubectl apply -k k8s/overlays/production/
```

### Health Checks

The deployment includes health checks:
- **Readiness Probe**: Ensures the container is ready to serve traffic
- **Liveness Probe**: Restarts the container if it becomes unresponsive

Monitor the deployment status:

```bash
kubectl get deployment ssvirt-ui
kubectl get pods -l app=ssvirt-ui
kubectl describe deployment ssvirt-ui
```

### Security

The deployment follows security best practices:
- Runs as non-root user
- Drops all capabilities
- Uses security contexts
- Includes resource limits
- Enables seccomp profile

### Troubleshooting

#### Check pod logs:
```bash
kubectl logs -l app=ssvirt-ui
```

#### Check service endpoints:
```bash
kubectl get endpoints ssvirt-ui
```

#### Test connectivity to backend:
```bash
kubectl exec -it deployment/ssvirt-ui -- curl http://ssvirt-backend:8080/health
```

#### Debug configuration:
```bash
kubectl exec -it deployment/ssvirt-ui -- cat /opt/app-root/src/dist/config.json
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
