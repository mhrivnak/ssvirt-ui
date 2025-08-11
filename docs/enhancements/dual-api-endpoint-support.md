# Enhancement: Dual API Endpoint Support

## Summary

This enhancement proposal outlines the changes needed to support dual API endpoints in the SSVIRT Web UI application. The API server now serves APIs at two base URLs:

- `/api/` - Legacy API endpoints
- `/cloudapi/` - VMware Cloud Director CloudAPI endpoints

This requires updates to the nginx configuration, Kubernetes manifests, API client configuration, and documentation to properly handle both endpoint types.

## Motivation

The application currently uses a single `apiBaseUrl` configuration that points to `/api`, but the implementation now requires access to both `/api/` and `/cloudapi/` endpoints:

- **CloudAPI endpoints** (`/cloudapi/`) are used for:
  - Authentication and session management
  - VM creation and management via vApp instantiation
  - Organization and VDC operations
  - Catalog and template browsing

- **Legacy API endpoints** (`/api/`) are used for:
  - User profile and preferences
  - Organization management
  - VDC queries
  - VM power operations
  - Catalog operations

## Current State Analysis

### Configuration Issues

1. **Single Base URL**: The current `apiBaseUrl` setting only supports one base path
2. **Hardcoded Paths**: CloudAPI endpoints are hardcoded with `/cloudapi/` prefix in `API_ENDPOINTS`
3. **Nginx Configuration**: Only proxies `/api/` requests to the backend
4. **Incomplete Routing**: No proxy configuration for `/cloudapi/` requests

### Current API Usage Patterns

- Authentication service uses `/cloudapi/1.0.0/sessions`
- VM services use both `/cloudapi/` and `/api/` endpoints
- Most endpoints in `API_ENDPOINTS` still use legacy `/api/` patterns
- CloudAPI services directly construct full paths with `/cloudapi/` prefix

## Proposed Solution

### 1. Configuration Changes

#### Update `apiBaseUrl` Semantics

Change the `apiBaseUrl` configuration to represent the **base server URL** rather than a specific API path:

**Before:**

```json
{
  "apiBaseUrl": "/api"
}
```

**After:**

```json
{
  "apiBaseUrl": ""
}
```

This allows the application to construct both `/api/` and `/cloudapi/` endpoints relative to the base URL.

#### Environment Variables

Update environment variable documentation to reflect the new semantics:

- `VITE_API_BASE_URL`: Base URL for all API requests (default: empty string for relative paths)

### 2. API Client Updates

#### Axios Instance Configuration

Update the API client to handle dual endpoints properly:

```typescript
// Create separate instances for different API types if needed
const createApiInstance = (basePath = ''): AxiosInstance => {
  const config = getConfig();

  // Normalize baseURL to prevent double slashes
  const normalizedBaseURL = config.API_BASE_URL.replace(/\/+$/, '');
  const normalizedBasePath = basePath.startsWith('/')
    ? basePath
    : `/${basePath}`;

  const instance = axios.create({
    baseURL: `${normalizedBaseURL}${normalizedBasePath}`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  // ... interceptors

  return instance;
};

// Main API instance for legacy endpoints
export const api = createApiInstance('/api');

// CloudAPI instance for VMware Cloud Director endpoints
export const cloudApi = createApiInstance('/cloudapi');
```

#### Service Layer Updates

Update services to use appropriate API instances:

```typescript
// Legacy API calls
const response = await api.get('/v1/organizations');

// CloudAPI calls
const response = await cloudApi.get('/1.0.0/sessions');
```

### 3. Nginx Configuration Updates

Add proxy configuration for CloudAPI endpoints:

```nginx
# Proxy legacy API requests to backend
location /api/ {
    proxy_pass http://api_backend/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # Proxy timeouts and error handling
    proxy_connect_timeout       5s;
    proxy_send_timeout          60s;
    proxy_read_timeout          60s;
    proxy_next_upstream         error timeout;
}

# Proxy CloudAPI requests to backend
location /cloudapi/ {
    proxy_pass http://api_backend/cloudapi/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # CloudAPI specific headers
    proxy_set_header X-VMWARE-VCLOUD-TENANT-CONTEXT $http_x_vmware_vcloud_tenant_context;

    # Proxy timeouts and error handling
    proxy_connect_timeout       5s;
    proxy_send_timeout          60s;
    proxy_read_timeout          60s;
    proxy_next_upstream         error timeout;
}
```

### 4. Kubernetes Manifest Updates

#### ConfigMap Changes

Update the configuration to use the new base URL semantics:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ssvirt-ui-config
data:
  config.json: |
    {
      "apiBaseUrl": "",
      "appTitle": "SSVIRT Web UI",
      "appVersion": "1.0.0",
      "logoUrl": "/vite.svg"
    }
```

#### Deployment Considerations

- No changes needed to deployment manifests
- Service discovery remains the same
- Health checks continue to work through existing endpoints

### 5. Development Environment

#### Local Development

Update development proxy configuration in `vite.config.ts`:

```typescript
export default defineConfig({
  // ...
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/cloudapi': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

## Implementation Plan

### Phase 1: Infrastructure Updates

1. Update nginx configuration to proxy both `/api/` and `/cloudapi/` endpoints
2. Update Kubernetes ConfigMap with new `apiBaseUrl` semantics
3. Update development environment proxy configuration

### Phase 2: API Client Refactoring

1. Create separate API instances for legacy and CloudAPI endpoints
2. Update service layer to use appropriate API instances
3. Refactor endpoint constants to remove hardcoded base paths

### Phase 3: Testing and Validation

1. Test all existing functionality with new configuration
2. Verify both API endpoints work correctly
3. Test authentication flows using CloudAPI
4. Validate VM creation and management operations

### Phase 4: Documentation

1. Update deployment documentation
2. Update development setup instructions
3. Update API integration documentation
4. Update troubleshooting guides

## Breaking Changes

### Configuration

- `apiBaseUrl` semantics change from API-specific path to base URL
- Existing configurations with `"apiBaseUrl": "/api"` will need to be updated to `"apiBaseUrl": ""`

### Environment Variables

- `VITE_API_BASE_URL` should be updated in deployment configurations
- Docker environment files may need updates

## Migration Guide

### For Deployments

1. Update nginx configuration to include CloudAPI proxy rules
2. Update ConfigMap `apiBaseUrl` value from `"/api"` to `""`
3. Restart nginx and frontend pods
4. Verify both API endpoints are accessible

### For Development

1. Update local `vite.config.ts` proxy configuration
2. Update environment variables in `.env` files
3. Test both legacy and CloudAPI endpoints work correctly

## Testing Strategy

### Unit Tests

- Test API client configuration with new base URL semantics
- Test service layer with separate API instances
- Mock both legacy and CloudAPI responses

### Integration Tests

- Test authentication flows using CloudAPI endpoints
- Test VM creation using CloudAPI vApp instantiation
- Test legacy API operations (user management, etc.)
- Test error handling for both endpoint types

### End-to-End Tests

- Test complete user workflows involving both API types
- Test nginx proxy configuration in deployed environment
- Test failover and error scenarios

## Security Considerations

### Headers and Authentication

- Ensure CloudAPI-specific headers are properly forwarded
- Maintain separation of authentication contexts between API types
- Validate CORS configuration for both endpoint types

### Access Control

- Verify nginx access controls apply to both endpoints
- Ensure rate limiting works for both API types
- Validate SSL/TLS termination for both paths

## Performance Impact

### Minimal Impact Expected

- No significant performance degradation anticipated
- Nginx proxy overhead remains the same
- API client overhead is minimal with separate instances

### Monitoring

- Monitor response times for both endpoint types
- Track error rates separately for legacy vs CloudAPI
- Monitor nginx proxy metrics for both paths

## Rollback Plan

### Configuration Rollback

1. Revert nginx configuration to original `/api/` only setup
2. Revert ConfigMap `apiBaseUrl` to `"/api"`
3. Restart affected services
4. CloudAPI functionality will be lost, but legacy features remain

### Code Rollback

- Code changes are backward compatible
- Can fallback to single API instance if needed
- No database or persistent state changes required

## Future Considerations

### API Consolidation

- Consider migrating all endpoints to CloudAPI standard
- Plan for eventual deprecation of legacy API endpoints
- Design abstraction layer for easier future migrations

### Configuration Evolution

- Consider more sophisticated API endpoint configuration
- Plan for multi-backend API scenarios
- Design for microservices API discovery patterns

## Success Criteria

1. **Functional Requirements**
   - Both `/api/` and `/cloudapi/` endpoints are accessible
   - Authentication works via CloudAPI endpoints
   - VM creation works via CloudAPI vApp instantiation
   - Legacy features continue to work via `/api/` endpoints

2. **Non-Functional Requirements**
   - No performance degradation
   - Deployment complexity does not increase significantly
   - Development environment setup remains straightforward
   - Monitoring and debugging capabilities are maintained

3. **Operational Requirements**
   - Nginx configuration is clear and maintainable
   - Kubernetes manifests are properly documented
   - Rollback procedures are tested and documented
   - Migration path is smooth for existing deployments
