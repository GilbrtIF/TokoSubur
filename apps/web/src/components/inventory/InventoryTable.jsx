import StatusBadge from './StatusBadge';
import PropTypes from 'prop-types';

// Terima prop 'data' dari parent
function InventoryTable({ data }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-500 font-medium">Tidak ada produk yang cocok.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
      
      {/* ✅ 1. TAMPILAN DESKTOP (Tabel) - Hanya muncul di layar md ke atas */}
      <div className="hidden md:block overflow-x-auto">
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

      {/* ✅ 2. TAMPILAN MOBILE (Card List) - Hanya muncul di layar kecil */}
      <div className="md:hidden flex flex-col divide-y divide-gray-100">
        {data.map((item) => (
          <div key={item.id} className="p-4 flex flex-col gap-3">
            {/* Header Card: Nama & Status */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.id}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>

            {/* Body Card: Grid Data */}
            <div className="grid grid-cols-4 gap-2 mt-1">
              <div>
                <p className="text-[10px] text-gray-400">Stok Sistem</p>
                <p className="text-xs font-semibold text-gray-800">{item.systemStock}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Safety Stock</p>
                <p className="text-xs font-semibold text-gray-800">{item.safetyStock}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Stok Fisik</p>
                <p className="text-xs font-semibold text-gray-800">{item.physicalStock}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Selisih</p>
                <p className={`text-xs font-semibold ${item.diff < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {item.diff}
                </p>
              </div>
            </div>

            {/* Footer Card: Stok Cukup */}
            <div className="mt-1 bg-gray-50 px-2 py-1.5 rounded-md w-max">
              <p className="text-[10px] text-gray-500">
                Stok Cukup: <span className="font-semibold text-gray-800">{item.daysLeft} hari</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

InventoryTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InventoryTable;