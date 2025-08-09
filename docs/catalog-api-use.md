# Catalog API Client Guide

## Overview

The catalog API provides VMware Cloud Director-compliant endpoints for managing catalogs. All endpoints follow CloudAPI patterns with URN-based identification and paginated responses.

## Base URL

`/cloudapi/1.0.0/catalogs`

## Authentication

All endpoints require JWT authentication via the Authorization: Bearer <token> header. Users can access catalogs from their organizations and any published catalogs.

## Endpoints

### 1. List Catalogs

GET /cloudapi/1.0.0/catalogs

**Query Parameters:**
  - page (optional): Page number, starts at 1 (default: 1)
  - pageSize (optional): Items per page, max 128 (default: 25)

  Response: 200 OK
  
  ```json
  {
    "resultTotal": 42,
    "pageCount": 2,
    "page": 1,
    "pageSize": 25,
    "values": [
      {
        "id": "urn:vcloud:catalog:12345678-1234-1234-1234-123456789012",
        "name": "Development Catalog",
        "description": "Templates for development environments",
        "org": {
          "id": "urn:vcloud:org:87654321-4321-4321-4321-210987654321"
        },
        "isPublished": false,
        "isSubscribed": false,
        "creationDate": "2024-01-15T10:30:00.000Z",
        "numberOfVAppTemplates": 5,
        "numberOfMedia": 0,
        "catalogStorageProfiles": [],
        "publishConfig": {
          "isPublished": false
        },
        "subscriptionConfig": {
          "isSubscribed": false
        },
        "distributedCatalogConfig": {},
        "owner": {
          "id": ""
        },
        "isLocal": true,
        "version": 1
      }
    ]
  }
  ```

### 2. Get Single Catalog

GET /cloudapi/1.0.0/catalogs/{catalogUrn}

**Path Parameters:**
- catalogUrn: Catalog URN (format: urn:vcloud:catalog:<uuid>)

  Response: 200 OK
  {
    "id": "urn:vcloud:catalog:12345678-1234-1234-1234-123456789012",
    "name": "Development Catalog",
    "description": "Templates for development environments",
    "org": {
      "id": "urn:vcloud:org:87654321-4321-4321-4321-210987654321"
    },
    "isPublished": false,
    "isSubscribed": false,
    "creationDate": "2024-01-15T10:30:00.000Z",
    "numberOfVAppTemplates": 5,
    "numberOfMedia": 0,
    "catalogStorageProfiles": [],
    "publishConfig": {
      "isPublished": false
    },
    "subscriptionConfig": {
      "isSubscribed": false
    },
    "distributedCatalogConfig": {},
    "owner": {
      "id": ""
    },
    "isLocal": true,
    "version": 1
  }

### 3. Create Catalog

POST /cloudapi/1.0.0/catalogs

**Request Body:**
  
  ```json
  {
    "name": "New Catalog",
    "description": "Description of the catalog",
    "orgId": "urn:vcloud:org:87654321-4321-4321-4321-210987654321",
    "isPublished": false
  }
  ```

**Required Fields:**
- name: Catalog name
- orgId: Organization URN where catalog will be created

**Optional Fields:**
- description: Catalog description
- isPublished: Whether catalog is published (default: false)

**Response:** 201 Created
  Returns the complete catalog object (same structure as GET response).

### 4. Update Catalog

PUT /cloudapi/1.0.0/catalogs/{catalogUrn}

**Path Parameters:**
- catalogUrn: Catalog URN to update

**Request Body:**
  
  ```json
  {
    "name": "Updated Catalog Name",      // Optional: new catalog name
    "description": "Updated description", // Optional: new description
    "isPublished": true                  // Optional: update publish status
  }
  ```

**Response:** 200 OK
Returns the complete updated catalog object (same structure as GET response).

### 5. Delete Catalog

DELETE /cloudapi/1.0.0/catalogs/{catalogUrn}

**Path Parameters:**
- catalogUrn: Catalog URN to delete

**Response:** 204 No Content (empty body)

## Data Schema

### Catalog Object

  interface Catalog {
    id: string;                           // URN: urn:vcloud:catalog:<uuid>
    name: string;                         // Catalog name
    description: string;                  // Catalog description
    org: OrgReference;                    // Organization reference
    isPublished: boolean;                 // Whether catalog is published externally
    isSubscribed: boolean;                // Whether catalog is subscribed from external source
    creationDate: string;                 // ISO-8601 timestamp
    numberOfVAppTemplates: number;        // Count of vApp templates in catalog
    numberOfMedia: number;                // Count of media items (always 0 currently)
    catalogStorageProfiles: any[];        // Storage profiles (always empty array)
    publishConfig: PublishConfig;         // Publish configuration
    subscriptionConfig: SubscriptionConfig; // Subscription configuration
    distributedCatalogConfig: object;     // Distributed catalog config (always empty)
    owner: OwnerReference;                // Owner reference
    isLocal: boolean;                     // Whether catalog is local (always true)
    version: number;                      // Catalog version (always 1)
  }

  interface OrgReference {
    id: string;                           // Organization URN
  }

  interface OwnerReference {
    id: string;                           // Owner URN (currently empty)
  }

  interface PublishConfig {
    isPublished: boolean;                 // Matches catalog.isPublished
  }

  interface SubscriptionConfig {
    isSubscribed: boolean;                // Matches catalog.isSubscribed
  }

  interface PaginatedResponse<T> {
    resultTotal: number;                  // Total number of items
    pageCount: number;                    // Total number of pages
    page: number;                         // Current page number
    pageSize: number;                     // Items per page
    values: T[];                          // Array of items
  }

### Create Request Schema

  interface CatalogCreateRequest {
    name: string;                         // Required: Catalog name
    description?: string;                 // Optional: Catalog description
    orgId: string;                        // Required: Organization URN
    isPublished?: boolean;                // Optional: Publish status (default: false)
  }

## Error Responses

### Common Error Format

  ```json
  {
    "error": "Error Type",
    "message": "Human readable message",
    "details": "Technical details"
  }
  ```

### HTTP Status Codes

  - 200 OK: Successful GET requests
  - 201 Created: Successful catalog creation
  - 204 No Content: Successful deletion
  - 400 Bad Request: Invalid request (malformed URN, missing fields)
  - 401 Unauthorized: Missing or invalid authentication
  - 404 Not Found: Catalog or organization not found
  - 409 Conflict: Cannot delete catalog with dependent vApp templates
  - 500 Internal Server Error: Server-side error

## Usage Examples

### JavaScript/TypeScript

  // List catalogs with pagination
  const response = await fetch('/cloudapi/1.0.0/catalogs?page=1&pageSize=10', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const catalogsPage = await response.json();

  // Get specific catalog
  const catalog = await fetch('/cloudapi/1.0.0/catalogs/urn:vcloud:catalog:12345678-1234-1234-1234-123456789012', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(r => r.json());

  // Create catalog
  const newCatalog = await fetch('/cloudapi/1.0.0/catalogs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'My Catalog',
      description: 'Test catalog',
      orgId: 'urn:vcloud:org:87654321-4321-4321-4321-210987654321',
      isPublished: false
    })
  }).then(r => r.json());

  // Delete catalog
  await fetch('/cloudapi/1.0.0/catalogs/urn:vcloud:catalog:12345678-1234-1234-1234-123456789012', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

## cURL Examples

```bash
# List catalogs
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.example.com/cloudapi/1.0.0/catalogs?page=1&pageSize=25"

# Get catalog
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.example.com/cloudapi/1.0.0/catalogs/urn:vcloud:catalog:12345678-1234-1234-1234-123456789012"

# Create catalog
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Catalog","orgId":"urn:vcloud:org:87654321-4321-4321-4321-210987654321","isPublished":false}' \
  "https://api.example.com/cloudapi/1.0.0/catalogs"

# Update catalog
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Catalog","description":"Updated description","isPublished":true}' \
  "https://api.example.com/cloudapi/1.0.0/catalogs/urn:vcloud:catalog:12345678-1234-1234-1234-123456789012"

# Delete catalog
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.example.com/cloudapi/1.0.0/catalogs/urn:vcloud:catalog:12345678-1234-1234-1234-123456789012"
```

## Important Notes

  1. URN Format: All catalog IDs use the format urn:vcloud:catalog:<uuid>
  2. Organization Access: Users can only create catalogs in organizations they have access to
  3. Published Catalogs: Published catalogs are visible to all users, regardless of organization
  4. Template Dependencies: Catalogs cannot be deleted if they contain vApp templates (409 error)
  5. Pagination: Results are sorted by creation date (newest first) with stable secondary sorting by ID
  6. Date Format: All timestamps are in ISO-8601 format (RFC3339)
  7. Media Support: Currently, numberOfMedia is always 0 (media items not yet supported)
  8. Storage Profiles: catalogStorageProfiles is always an empty array