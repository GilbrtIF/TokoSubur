import StatusBadge from './StatusBadge';
import PropTypes from 'prop-types';

// Terima prop 'data' dari parent
function InventoryTable({ data }) {
  // Jika hasil pencarian/filter kosong
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <p className="text-gray-500 font-medium">Tidak ada produk yang cocok dengan kriteria Anda.</p>
        <p className="text-sm text-gray-400 mt-1">Coba ubah kata kunci atau filter status.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-[#FAF9F6] text-xs uppercase text-gray-400 font-semibold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Nama Produk</th>
              <th className="px-4 py-4 text-center">Stok Sistem</th>
              <th className="px-4 py-4 text-center">Safety Stock</th>
              <th className="px-4 py-4 text-center">Stok Fisik</th>
              <th className="px-4 py-4 text-center">Selisih</th>
              <th className="px-4 py-4 text-center">Stok Cukup</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {/* Map dari 'data' prop, bukan dari import */}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.id}</p>
                </td>
                <td className="px-4 py-4 text-center">{item.systemStock}</td>
                <td className="px-4 py-4 text-center">{item.safetyStock}</td>
                <td className="px-4 py-4 text-center">{item.physicalStock}</td>
                <td className={`px-4 py-4 text-center font-medium ${item.diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {item.diff}
                </td>
                <td className="px-4 py-4 text-center text-xs text-gray-500">{item.daysLeft} hari</td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

InventoryTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InventoryTable;