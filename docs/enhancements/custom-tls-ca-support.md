# Enhancement Proposal: HTTP Proxy Sidecar for API Communication

## Summary

This enhancement proposal adds an nginx proxy sidecar container to the SSVIRT UI pod to handle API communication. The proxy eliminates browser certificate validation issues by serving both the UI and API through a single endpoint with proper TLS termination.

## Motivation

Currently, the SSVIRT UI cannot establish secure connections to API servers that use custom CA certificates or self-signed certificates due to browser security limitations. This is a common scenario in:

1. **OpenShift/Kubernetes environments** where routes use custom certificates
2. **Enterprise environments** with internal certificate authorities
3. **Development/testing environments** using self-signed certificates

Browser security models prevent JavaScript from programmatically adding certificates to the trust store, causing API calls to fail with certificate validation errors.

## Goals

- Enable secure API communication regardless of API server certificate configuration
- Eliminate browser certificate validation issues
- Leverage OpenShift Route for TLS termination while handling internal API certificates
- Maintain backward compatibility with existing deployments
- Follow Kubernetes best practices for multi-container pods

## Non-Goals

- Client certificate authentication (mutual TLS)
- Dynamic certificate rotation/reload at runtime
- Complex API routing or transformation beyond proxying

## Proposal

### Architecture Overview

```
Browser → HTTPS (OpenShift Route) → HTTP → Pod [nginx proxy + UI container]
                                               ↓
                          nginx proxy → HTTP/HTTPS (internal) → API Service
```

The solution uses a sidecar proxy container that:

- Serves the React UI on `/`
- Proxies API requests from `/api/*` to the backend API service
- Handles custom CA certificate validation for internal API communication
- OpenShift Route provides the single TLS termination point for external traffic

### Implementation Details

#### 1. Multi-Container Pod

**k8s/deployment.yaml** - Add nginx sidecar container:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ssvirt-ui
spec:
  template:
    spec:
      containers:
        # Existing UI container
        - name: ssvirt-ui
          image: quay.io/mhrivnak/ssvirt-ui:latest
          ports:
            - containerPort: 8080
              name: ui
          volumeMounts:
            - name: config-volume
              mountPath: /opt/app-root/src/dist/config.json
              subPath: config.json
              readOnly: true

        # New nginx proxy sidecar
        - name: nginx-proxy
          image: registry.access.redhat.com/ubi9/nginx-126:latest
          ports:
            - containerPort: 8081
              name: proxy
          volumeMounts:
            - name: nginx-config
              mountPath: /etc/nginx/nginx.conf
              subPath: nginx.conf
              readOnly: true

      volumes:
        - name: config-volume
          configMap:
            name: ssvirt-ui-config
        - name: nginx-config
          configMap:
            name: ssvirt-nginx-config
```

#### 2. nginx Configuration

**k8s/nginx-configmap.yaml** - nginx proxy configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ssvirt-nginx-config
data:
  nginx.conf: |
    events {
        worker_connections 1024;
    }

    http {
        upstream ui_backend {
            server localhost:8080;
        }
        
        upstream api_backend {
            server ssvirt-backend.ssvirt.svc.cluster.local:8080;
        }
        
        server {
            listen 8081;
            
            # Serve UI application
            location / {
                proxy_pass http://ui_backend;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
            
            # Proxy API requests to backend
            location /api/ {
                proxy_pass http://api_backend/api/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
    }
```

#### 3. Service Configuration

**k8s/deployment.yaml** - Update service to point to nginx proxy:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ssvirt-ui
spec:
  ports:
    - port: 8080
      targetPort: 8081 # Point to nginx proxy port
      name: http
  selector:
    app: ssvirt-ui
```

#### 4. UI Configuration

**k8s/configmap.yaml** - Update UI config to use relative API path:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ssvirt-ui-config
data:
  config.json: |
    {
      "apiBaseUrl": "/api",
      "appTitle": "SSVIRT Web UI",
      "appVersion": "1.0.0",
      "logoUrl": "/vite.svg"
    }
```

## User Experience

### Deployment Process

1. **Apply all manifests**:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/deployment.yaml
```

2. **Access the application** through the OpenShift Route endpoint

### OpenShift Integration

The nginx proxy uses HTTP for all internal communication, eliminating certificate validation issues:

- **External traffic**: OpenShift Route handles HTTPS termination with proper certificates
- **Internal communication**: All proxy traffic is HTTP within the cluster
- **No certificate configuration needed**: nginx proxy operates purely at the HTTP level

### Error Handling

- **nginx logs** provide visibility into proxy issues
- **Clear separation** between UI issues and API connectivity issues
- **Simplified debugging** with HTTP-only internal communication

### Deployment Documentation

Update README.md with:

- Multi-container pod architecture explanation
- nginx proxy configuration examples
- Explanation that no certificate configuration is needed (all HTTP internal communication)
- Troubleshooting guide for proxy issues

## Security Considerations

1. **OpenShift Route TLS Termination**: External TLS handled by OpenShift Route infrastructure
2. **Internal HTTP Communication**: nginx proxy uses HTTP for all internal communication within the secure cluster network
3. **Principle of Least Privilege**: nginx runs with minimal permissions in sidecar container
4. **Network Security**: All communication stays within cluster network boundaries
5. **Route Security**: Leverages OpenShift's existing certificate management and rotation
6. **Simplified Attack Surface**: No certificate handling in nginx reduces potential security issues

## Testing

1. **Unit tests** for UI configuration with relative API paths
2. **Integration tests** with nginx proxy in development environment
3. **E2E tests** in OpenShift with custom route certificates
4. **Performance tests** to measure proxy overhead
5. **Security tests** for certificate validation and proxy behavior

## Alternatives Considered

### 1. Client-Side Certificate Management

- **Pros**: No additional containers
- **Cons**: Browser security limitations make this impossible

### 2. Envoy Proxy Sidecar

- **Pros**: More advanced routing capabilities
- **Cons**: More complex configuration, larger resource footprint

### 3. API Gateway Solution

- **Pros**: Centralized API management
- **Cons**: Additional infrastructure complexity

### 4. Service Mesh Integration

- **Pros**: Comprehensive network management
- **Cons**: Requires service mesh installation and management

## Implementation Plan

1. **Phase 1**: Create nginx configuration and multi-container deployment
2. **Phase 2**: Update UI configuration to use relative API paths
3. **Phase 3**: Add CA certificate support for internal API communication
4. **Phase 4**: Update documentation and testing
5. **Phase 5**: Performance optimization and monitoring

## Future Enhancements

- **Multiple API backends** with intelligent routing
- **Load balancing** across multiple API instances
- **Request/response transformation** for API compatibility
- **Monitoring and metrics** collection at the proxy layer
- **Rate limiting** and security headers
