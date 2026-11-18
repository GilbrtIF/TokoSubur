import PropTypes from 'prop-types';

function HistoryTable({ items }) {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-white text-[11px] uppercase text-gray-400 font-semibold border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 w-1/3">Produk</th>
            <th className="px-4 py-3 text-center">Stok Sistem</th>
            <th className="px-4 py-3 text-center">Stok Fisik</th>
            <th className="px-4 py-3 text-center">Selisih</th>
            <th className="px-4 py-3">Alasan selisih</th>
            <th className="px-6 py-3">Keterangan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-[#FAF9F6]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-100/50">
              <td className="px-6 py-4">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.sku}</p>
              </td>
              <td className="px-4 py-4 text-center">{item.systemStock}</td>
              <td className="px-4 py-4 text-center">{item.physicalStock}</td>
              <td className={`px-4 py-4 text-center font-bold ${
                item.diff < 0 ? 'text-red-500' : item.diff > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {item.diff > 0 ? `+${item.diff}` : item.diff}
              </td>
              <td className="px-4 py-4 text-gray-500">{item.reason}</td>
              <td className="px-6 py-4 text-gray-500 text-xs">{item.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

HistoryTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default HistoryTable;