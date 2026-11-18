import { Link } from 'react-router-dom'; // Import Link di sini
import { History, ClipboardList, Upload } from 'lucide-react';

function InventoryHeader() {
  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <span>Workspace</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Inventory</span>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="bg-[#F4F9E8] text-[#6B8E23] px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 w-max">
          <span className="w-2 h-2 rounded-full bg-[#6B8E23]"></span>
          Last updated: Today 09:42 AM
        </div>

        <div className="flex items-center gap-3">
          {/* ✅ PERBAIKAN: Ubah <button> menjadi <Link> */}
          <Link 
            to="/inventory/history"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <History size={16} /> Riwayat Stok
          </Link>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <ClipboardList size={16} /> Stok Opname
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-[#C6F25E] rounded-lg hover:bg-[#b5e04c]">
            <Upload size={16} /> Import Stok
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryHeader;