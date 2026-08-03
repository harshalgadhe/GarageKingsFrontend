import React from 'react';
import VaultModuleCard from './VaultModuleCard';

/**
 * ProductCard wrapper exporting the GarageKings VaultModuleCard
 */
export default function ProductCard({ car, onClick, isPreview = false }) {
  return <VaultModuleCard car={car} onClick={onClick} isPreview={isPreview} />;
}
