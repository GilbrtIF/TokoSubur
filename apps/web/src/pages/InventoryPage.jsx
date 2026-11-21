import InventoryHeader from '../components/inventory/InventoryHeader';
import SummaryCard from '../components/inventory/SummaryCard';
import InventoryToolbar from '../components/inventory/InventoryToolbar';
import InventoryTable from '../components/inventory/InventoryTable';
import TablePagination from '../components/inventory/TablePagination';
import { useInventory } from '../hooks/useInventory'; 

function InventoryPage() {
  const { data, searchQuery, setSearchQuery, activeFilter, setActiveFilter } = useInventory();

  return (
    <div className="w-full">
      <InventoryHeader />

      {/* ✅ Grid 2 kolom untuk Mobile, 4 kolom untuk Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <SummaryCard title="Total SKU Aktif" value="48" />
        <SummaryCard title="Total SKU Selisih Opname" value="3" valueColor="text-purple-600" />
        <SummaryCard title="Prediksi SKU untuk Restock" value="22" />
        <SummaryCard title="Total SKU Kritis" value="18" valueColor="text-red-500" />
      </div>

      <InventoryToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      
      <InventoryTable data={data} />
      
      <TablePagination />
    </div>
  );
}

export default InventoryPage;