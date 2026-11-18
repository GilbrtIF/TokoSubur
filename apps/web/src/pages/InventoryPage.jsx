import InventoryHeader from '../components/inventory/InventoryHeader';
import SummaryCard from '../components/inventory/SummaryCard';
import InventoryToolbar from '../components/inventory/InventoryToolbar';
import InventoryTable from '../components/inventory/InventoryTable';
import TablePagination from '../components/inventory/TablePagination';
import { useInventory } from '../hooks/useInventory'; 

function InventoryPage() {
  // Panggil custom hook kita
  const { 
    data, 
    searchQuery, 
    setSearchQuery, 
    activeFilter, 
    setActiveFilter 
  } = useInventory();

  return (
    <div className="w-full">
      <InventoryHeader />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total SKU Aktif" value="48" />
        <SummaryCard title="Total SKU Kritis" value="18" valueColor="text-red-500" />
        <SummaryCard title="Prediksi SKU untuk Restock" value="22" />
        <SummaryCard title="Total SKU selisih Opname" value="3" valueColor="text-purple-600" />
      </div>

      {/* Oper state dan fungsi ke Toolbar */}
      <InventoryToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      
      {/* Oper data hasil filter ke Tabel */}
      <InventoryTable data={data} />
      
      <TablePagination />
    </div>
  );
}

export default InventoryPage;