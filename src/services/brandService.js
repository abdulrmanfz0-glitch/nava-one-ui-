/**
 * Brand Service
 * Handles brand creation, updates, deletion, and user-brand linking
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { APIError } from './api';

/**
 * Generic API request wrapper
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

export const brandService = {
  /**
   * Create a new brand for a user
   */
  async createBrand(userId, brandData) {
    const payload = {
      user_id: userId,
      name: brandData.name,
      description: brandData.description || null,
      logo_url: brandData.logoUrl || null,
      created_at: new Date().toISOString()
    };

    return apiRequest(
      () => supabase.from('brands').insert([payload]).select().single(),
      'Failed to create brand'
    );
  },

  /**
   * Get all brands owned by user
   */
  async getUserBrands(userId) {
    return apiRequest(
      () =>
        supabase
          .from('brands')
          .select('*, branches(count)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      'Failed to fetch user brands'
    );
  },

  /**
   * Get detailed brand info
   */
  async getBrandById(brandId) {
    return apiRequest(
      () =>
        supabase
          .from('brands')
          .select('*, branches(*)')
          .eq('id', brandId)
          .single(),
      'Failed to fetch brand'
    );
  },

  /**
   * Update brand info
   */
  async updateBrand(brandId, updates) {
    return apiRequest(
      () =>
        supabase
          .from('brands')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', brandId)
          .select()
          .single(),
      'Failed to update brand'
    );
  },

  /**
   * Delete brand + all branches (cascade)
   */
  async deleteBrand(brandId) {
    return apiRequest(
      () => supabase.from('brands').delete().eq('id', brandId),
      'Failed to delete brand'
    );
  },

  /**
   * Upload brand logo
   */
  async uploadLogo(file, brandId) {
    const filePath = `brands/${brandId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('brand-logos')
      .upload(filePath, file);

    if (error) {
      throw new APIError('Failed to upload logo', 'UPLOAD_ERROR', error);
    }

    const url = supabase.storage.from('brand-logos').getPublicUrl(filePath).data.publicUrl;

    // Update brand with logo
    await this.updateBrand(brandId, { logo_url: url });

    return url;
  }
};

export default brandService;
