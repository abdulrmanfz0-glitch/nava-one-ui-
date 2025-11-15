import { createContext, useContext, useState, useEffect } from 'react';
import { brandAPI } from '@/services/api';
import { logger } from '@/lib/logger';
import { useAuth } from './AuthContext';

const BrandContext = createContext(null);

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

export const BrandProvider = ({ children }) => {
  const { user } = useAuth();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch brand data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchBrand();
    } else {
      setBrand(null);
      setLoading(false);
    }
  }, [user]);

  const fetchBrand = async () => {
    try {
      setLoading(true);
      setError(null);
      const brandData = await brandAPI.get();
      setBrand(brandData);
      logger.info('Brand loaded successfully', { brandId: brandData?.id });
    } catch (err) {
      // If user doesn't have a brand yet, it's not necessarily an error
      if (err.code === 'PGRST116') {
        // No rows returned - user hasn't set up brand yet
        logger.info('No brand found for user');
        setBrand(null);
      } else {
        logger.error('Failed to fetch brand', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brandData) => {
    try {
      setLoading(true);
      setError(null);

      // Add user_id if not present
      if (!brandData.user_id && user) {
        brandData.user_id = user.id;
      }

      const newBrand = await brandAPI.create(brandData);
      setBrand(newBrand);
      logger.info('Brand created successfully', { brandId: newBrand.id });
      return newBrand;
    } catch (err) {
      logger.error('Failed to create brand', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (updates) => {
    try {
      setLoading(true);
      setError(null);

      const updatedBrand = await brandAPI.update({
        id: brand.id,
        ...updates
      });

      setBrand(updatedBrand);
      logger.info('Brand updated successfully', { brandId: updatedBrand.id });
      return updatedBrand;
    } catch (err) {
      logger.error('Failed to update brand', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshBrand = () => {
    return fetchBrand();
  };

  const value = {
    brand,
    loading,
    error,
    hasBrand: brand !== null,
    createBrand,
    updateBrand,
    refreshBrand
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};

export default BrandContext;
