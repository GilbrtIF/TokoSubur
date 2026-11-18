import PropTypes from 'prop-types';

function SummaryCard({ title, value, valueColor = 'text-gray-900' }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <p className={`text-4xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

SummaryCard.propTypes = { 
  title: PropTypes.string.isRequired, 
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  valueColor: PropTypes.string
};
export default SummaryCard;