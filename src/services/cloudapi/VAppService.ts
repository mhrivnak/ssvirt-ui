import { cloudApi } from '../api';
import { VMService } from './VMService';
import type {
  VApp,
  CreateVAppFromTemplateRequest,
  VCloudPaginatedResponse,
} from '../../types';

/**
 * VApp Service - Simplified interface for vApp operations
 * Wraps VMService methods with cleaner API for vApp creation and management
 */
export class VAppService {
  /**
   * Sanitize catalog item URN to ensure proper format
   * Removes any appended name or extra text that might be present
   * @param catalogItemId The potentially malformed catalog item ID
   * @returns Clean catalog item URN
   */
  private static sanitizeCatalogItemUrn(catalogItemId: string): string {
    // Expected format: urn:vcloud:catalogitem:uuid
    // Sometimes APIs return: urn:vcloud:catalogitem:uuid:name or similar

    // If it's already a proper URN, extract just the URN part
    const urnMatch = catalogItemId.match(
      /^(urn:vcloud:catalogitem:[a-f0-9-]+)/i
    );
    if (urnMatch) {
      return urnMatch[1];
    }

    // If it doesn't match the expected format, return as-is and let the API handle it
    return catalogItemId;
  }

  /**
   * Create a vApp from a catalog template
   * @param vdcId The VDC URN where the vApp will be created
   * @param request vApp creation configuration
   */
  static async createFromTemplate(
    vdcId: string,
    request: CreateVAppFromTemplateRequest
  ): Promise<VApp> {
    // Sanitize the catalog item ID to ensure it's a proper URN
    // Sometimes APIs return composite IDs with names appended
    const sanitizedCatalogItemId = this.sanitizeCatalogItemUrn(
      request.catalogItem.id
    );

    // Create the request body according to the API documentation
    const apiRequest = {
      name: request.name,
      description: request.description,
      catalogItem: {
        id: sanitizedCatalogItemId,
        name: request.catalogItem.name,
      },
    };

    // Make the API call directly using the correct format
    const response = await cloudApi.post<VApp>(
      `/1.0.0/vdcs/${encodeURIComponent(vdcId)}/actions/instantiateTemplate`,
      apiRequest
    );

    // The API returns a single vApp object, not a paginated collection
    if (response.data && response.data.id) {
      return response.data;
    }

    throw new Error('Failed to create vApp: No vApp returned from API');
  }

  /**
   * Get vApp details
   * @param vappId The vApp URN
   */
  static async getVApp(vappId: string): Promise<VApp> {
    return VMService.getVApp(vappId);
  }

  /**
   * List vApps for a specific VDC
   * @param vdcId The VDC URN
   */
  static async getVAppsByVDC(
    vdcId: string
  ): Promise<VCloudPaginatedResponse<VApp>> {
    return VMService.getVAppsByVDC(vdcId);
  }

  /**
   * Delete a vApp
   * @param vappId The vApp URN
   */
  static async deleteVApp(vappId: string): Promise<void> {
    return VMService.deleteVApp(vappId);
  }

  /**
   * Validate vApp name uniqueness within a VDC
   * @param vdcId The VDC URN
   * @param name The proposed vApp name
   */
  static async validateVAppName(vdcId: string, name: string): Promise<boolean> {
    try {
      const vapps = await this.getVAppsByVDC(vdcId);
      const existingNames =
        vapps.values?.map((vapp) => vapp.name.toLowerCase()) || [];
      return !existingNames.includes(name.toLowerCase());
    } catch (error) {
      console.error('Error validating vApp name:', error);
      // If we can't validate, assume it's valid to avoid blocking user
      return true;
    }
  }
}
