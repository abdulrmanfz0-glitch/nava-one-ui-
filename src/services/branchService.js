/**
 * Branch Service
 * Handles creation, listing, limits, and deletion for brand branches
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { APIError } from './api';
import { branchBasedPricingAPI } from './subscriptionService';

/**
 * API wrapper
 */
async function apiRequest(fn, errorMessage = 'API request failed') {
  try {
    const { data, error } = await fn();

    if (error) {
      logger.error(errorMessage, error);
      throw new APIError(error.message, error.code, error);
    }

    return data;
  } catch (error) {
    logger.error(errorMessage, error);
    throw new APIError(
      error.message || errorMessage,
      error.code || 'UNKNOWN_ERROR',
      error
    );
  }
}

export const branchService = {
  /**
   * Create a new branch under brand
   */
  async createBranch(brandId, branchData) {
    const payload = {
      brand_id: brandId,
      name: branchData.name,
      address: branchData.address || null,
      city: branchData.city || null,
      phone: branchData.phone || null,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    return apiRequest(
      () => supabase.from('branches').insert([payload]).select().single(),
      'Failed to create branch'
    );
  },

  /**
   * Get all branches under a brand
   */
  async getBrandBranches(brandId) {
    return apiRequest(
      () =>
        supabase
          .from('branches')
          .select('*')
          .eq('brand_id', brandId)
          .order('created_at', { ascending: true }),
      'Failed to fetch branches'
    );
  },

  /**
   * Count branches to calculate pricing
   */
  async countBrandBranches(brandId) {
    return apiRequest(
      () =>
        supabase
          .from('branches')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brandId),
      'Failed to count branches'
    );
  },

  /**
   * Update a branch
   */
  async updateBranch(branchId, updates) {
    return apiRequest(
      () =>
        supabase
          .from('branches')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', branchId)
          .select()
          .single(),
      'Failed to update branch'
    );
  },

  /**
   * Soft delete (recommended)
   */
  async deleteBranch(branchId) {
    return apiRequest(
      () =>
        supabase
          .from('branches')
          .update({ status: 'deleted', deleted_at: new Date().toISOString() })
          .eq('id', branchId)
          .select()
          .single(),
      'Failed to delete branch'
    );
  },

  /**
   * Hard delete (optional)
   */
  async forceDelete(branchId) {
    return apiRequest(
      () => supabase.from('branches').delete().eq('id', branchId),
      'Failed to permanently delete branch'
    );
  },

  /**
   * Get pricing breakdown for brand based on number of branches
   */
  async getPricingForBrand(brandId) {
    const count = await this.countBrandBranches(brandId);
    const branchCount = count.count || 0;
    return branchBasedPricingAPI.getPricingBreakdown(branchCount);
  }
};

export default branchService;
