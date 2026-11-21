import { Search } from 'lucide-react';
import useInput from '../../hooks/useInput'; // Import hook buatan Anda
import PropTypes from 'prop-types';

function InventoryToolbar({ searchQuery, onSearchChange, activeFilter, onFilterChange }) {
  const [localSearch, onLocalSearchChange] = useInput(searchQuery);

  const handleSearch = (e) => {
    onLocalSearchChange(e);
    onSearchChange(e.target.value);
  };

  const filters = ['All', 'Aman', 'Waspada', 'Kritis', 'Selisih'];

  return (
    <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-2 mb-4 md:mb-6">
      
      {/* Search Input (Full width di mobile) */}
      <div className="relative w-full md:w-96 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search SKUs / Product Name" 
          value={localSearch}
          onChange={handleSearch}
          className="w-full bg-[#FAF9F6] text-sm text-gray-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#C6F25E]"
        />
      </div>

      {/* Filter Tabs (Bisa di-scroll di mobile) */}
      <div className="flex items-center gap-1 w-full overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
        {filters.map((filter) => (
          <button 
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}

InventoryToolbar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default InventoryToolbar;