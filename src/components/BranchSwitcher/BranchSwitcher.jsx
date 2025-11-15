import React, { useState, useRef, useEffect } from 'react';
import { useBranchSelection } from '../../contexts/BranchSelectionContext';
import './BranchSwitcher.css';

/**
 * BranchSwitcher Component
 * Dropdown to select active branch
 * Displayed in the header for quick switching between locations
 */
const BranchSwitcher = ({ className = '' }) => {
  const {
    branches,
    selectedBranch,
    selectBranch,
    loading,
    branchCount,
  } = useBranchSelection();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleBranchSelect = (branchId) => {
    selectBranch(branchId);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Don't render if loading or no branches
  if (loading) {
    return (
      <div className={`branch-switcher-skeleton ${className}`}>
        <div className="skeleton-box"></div>
      </div>
    );
  }

  if (branchCount === 0) {
    return (
      <div className={`branch-switcher-empty ${className}`}>
        <span className="no-branch-text">No Branches</span>
      </div>
    );
  }

  // If only one branch, show it without dropdown
  if (branchCount === 1) {
    return (
      <div className={`branch-switcher-single ${className}`}>
        <div className="branch-display">
          <svg className="branch-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="branch-name">{selectedBranch?.branch_name || 'Branch'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`branch-switcher ${className}`} ref={dropdownRef}>
      <button
        className="branch-switcher-button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="branch-display">
          <svg className="branch-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <div className="branch-info">
            <span className="branch-label">Branch</span>
            <span className="branch-name">
              {selectedBranch?.branch_name || 'Select Branch'}
            </span>
          </div>
        </div>
        <svg
          className={`chevron-icon ${isOpen ? 'open' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="branch-dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">Switch Branch</span>
            <span className="dropdown-count">{branchCount} locations</span>
          </div>
          <div className="dropdown-list">
            {branches.map((branch) => (
              <button
                key={branch.id}
                className={`dropdown-item ${selectedBranch?.id === branch.id ? 'active' : ''}`}
                onClick={() => handleBranchSelect(branch.id)}
              >
                <div className="item-content">
                  <div className="item-main">
                    <svg className="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="item-text">
                      <span className="item-name">{branch.branch_name}</span>
                      {branch.branch_location && (
                        <span className="item-location">{branch.branch_location}</span>
                      )}
                    </div>
                  </div>
                  {selectedBranch?.id === branch.id && (
                    <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;
