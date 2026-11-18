import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';
import HistoryTable from './HistoryTable';

function HistoryGroup({ date, time, type, items, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] mb-4 overflow-hidden">
      
      {/* Header Accordion (Bisa Diklik) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
            <Calendar size={16} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">{date}</h3>
            <p className="text-xs text-gray-400">({time})</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-[#FAF9F6] border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg">
            {type}
          </span>
          <div className="text-gray-400">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>

      {/* Konten Accordion (Tabel) */}
      {isOpen && (
        <div className="border-t border-gray-100">
          <HistoryTable items={items} />
        </div>
      )}
    </div>
  );
}

HistoryGroup.propTypes = {
  date: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  defaultOpen: PropTypes.bool,
};

export default HistoryGroup;