import { Calendar, Search } from 'lucide-react';
import PropTypes from 'prop-types';

function InventoryFilterBar({ dateLabel = "Tanggal Opname", searchLabel = "Cari Produk / SKU" }) {
  return (
    <div className="p-6 md:px-8 grid grid-cols-2 gap-4 bg-[#FAF9F6] border-b border-gray-100">
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">{dateLabel}</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="date" className="w-full bg-white border border-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#C6F25E]" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">{searchLabel}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" placeholder="Cari..." className="w-full bg-white border border-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#C6F25E]" />
        </div>
      </div>
    </div>
  );
}

InventoryFilterBar.propTypes = {
  dateLabel: PropTypes.string,
  searchLabel: PropTypes.string,
};

export default InventoryFilterBar;