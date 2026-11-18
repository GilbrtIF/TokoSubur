import { useState, useMemo } from 'react';
import { mockInventoryData } from '../utils/mockInventory';

export function useInventory() {
  // State untuk pencarian dan filter tab
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // useMemo agar proses filter tidak berjalan berat saat render ulang
  const filteredData = useMemo(() => {
    return mockInventoryData.filter((item) => {
      // 1. Cek kecocokan dengan Search Query (Nama Produk atau SKU)
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Cek kecocokan dengan Tab Filter yang aktif
      const matchStatus =
        activeFilter === 'All' || item.status === activeFilter;

      return matchSearch && matchStatus;
    });
  }, [searchQuery, activeFilter]);

  return {
    data: filteredData,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
  };
}