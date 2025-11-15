import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import api from '../services/api';

const BranchSelectionContext = createContext();

/**
 * BranchSelectionProvider
 * Manages the currently selected branch across the application
 * Provides branch switching functionality
 */
export const BranchSelectionProvider = ({ children }) => {
  const { user } = useAuth();
  const { brand } = useBrand();

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all branches for the current brand
   */
  const fetchBranches = useCallback(async () => {
    if (!user || !brand) {
      setBranches([]);
      setSelectedBranch(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await api.branches.getAll();
      setBranches(data || []);

      // Auto-select branch logic:
      // 1. If a branch was previously selected and still exists, keep it
      // 2. Otherwise, select the main branch from brand
      // 3. Otherwise, select the first branch
      // 4. Otherwise, no branch selected

      if (selectedBranch && data.some(b => b.id === selectedBranch.id)) {
        // Keep current selection if it still exists
        const updatedBranch = data.find(b => b.id === selectedBranch.id);
        setSelectedBranch(updatedBranch);
      } else if (brand.main_branch_id && data.some(b => b.id === brand.main_branch_id)) {
        // Select main branch
        const mainBranch = data.find(b => b.id === brand.main_branch_id);
        setSelectedBranch(mainBranch);
      } else if (data.length > 0) {
        // Select first branch
        setSelectedBranch(data[0]);
      } else {
        // No branches available
        setSelectedBranch(null);
      }

    } catch (err) {
      console.error('Error fetching branches:', err);
      setError(err.message || 'Failed to load branches');
      setBranches([]);
      setSelectedBranch(null);
    } finally {
      setLoading(false);
    }
  }, [user, brand, selectedBranch]);

  /**
   * Initialize branches on mount and when brand changes
   */
  useEffect(() => {
    fetchBranches();
  }, [user, brand?.id]); // Don't include fetchBranches to avoid infinite loop

  /**
   * Select a specific branch by ID
   */
  const selectBranch = useCallback((branchId) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch);
      // Store selection in localStorage for persistence
      localStorage.setItem('selectedBranchId', branchId);
    }
  }, [branches]);

  /**
   * Select a branch by object
   */
  const selectBranchByObject = useCallback((branch) => {
    if (branch && branch.id) {
      setSelectedBranch(branch);
      localStorage.setItem('selectedBranchId', branch.id);
    }
  }, []);

  /**
   * Refresh branches list
   */
  const refreshBranches = useCallback(async () => {
    await fetchBranches();
  }, [fetchBranches]);

  /**
   * Add a new branch and optionally select it
   */
  const addBranch = useCallback(async (branchData, selectAfterAdd = true) => {
    try {
      const newBranch = await api.branches.create(branchData);
      await refreshBranches();

      if (selectAfterAdd && newBranch) {
        selectBranchByObject(newBranch);
      }

      return newBranch;
    } catch (err) {
      console.error('Error adding branch:', err);
      throw err;
    }
  }, [refreshBranches, selectBranchByObject]);

  /**
   * Update a branch
   */
  const updateBranch = useCallback(async (branchId, branchData) => {
    try {
      const updatedBranch = await api.branches.update(branchId, branchData);
      await refreshBranches();

      // Update selected branch if it was the one modified
      if (selectedBranch?.id === branchId) {
        setSelectedBranch(updatedBranch);
      }

      return updatedBranch;
    } catch (err) {
      console.error('Error updating branch:', err);
      throw err;
    }
  }, [refreshBranches, selectedBranch]);

  /**
   * Delete a branch
   */
  const deleteBranch = useCallback(async (branchId) => {
    try {
      await api.branches.delete(branchId);

      // If deleted branch was selected, clear selection
      if (selectedBranch?.id === branchId) {
        setSelectedBranch(null);
        localStorage.removeItem('selectedBranchId');
      }

      await refreshBranches();
    } catch (err) {
      console.error('Error deleting branch:', err);
      throw err;
    }
  }, [refreshBranches, selectedBranch]);

  /**
   * Get branch statistics
   */
  const getBranchStatistics = useCallback(async (branchId, dateRange) => {
    try {
      return await api.branches.getStatistics(branchId, dateRange);
    } catch (err) {
      console.error('Error fetching branch statistics:', err);
      throw err;
    }
  }, []);

  /**
   * Get branch performance data
   */
  const getBranchPerformance = useCallback(async (branchId, period) => {
    try {
      return await api.branches.getPerformance(branchId, period);
    } catch (err) {
      console.error('Error fetching branch performance:', err);
      throw err;
    }
  }, []);

  const value = {
    // State
    branches,
    selectedBranch,
    loading,
    error,

    // Branch count
    branchCount: branches.length,
    hasMultipleBranches: branches.length > 1,

    // Actions
    selectBranch,
    selectBranchByObject,
    refreshBranches,
    addBranch,
    updateBranch,
    deleteBranch,

    // Data fetching
    getBranchStatistics,
    getBranchPerformance,
  };

  return (
    <BranchSelectionContext.Provider value={value}>
      {children}
    </BranchSelectionContext.Provider>
  );
};

/**
 * Hook to use branch selection context
 */
export const useBranchSelection = () => {
  const context = useContext(BranchSelectionContext);
  if (!context) {
    throw new Error('useBranchSelection must be used within a BranchSelectionProvider');
  }
  return context;
};

export default BranchSelectionContext;
