import PropTypes from 'prop-types';

function StatusBadge({ status }) {
  const styles = {
    Aman: 'bg-[#E8F5E9] text-[#2E7D32]', // Hijau
    Waspada: 'bg-[#FFF3E0] text-[#E65100]', // Oranye
    Kritis: 'bg-[#FFEBEE] text-[#C62828]', // Merah
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max ${styles[status] || styles.Aman}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
}

StatusBadge.propTypes = { status: PropTypes.string.isRequired };
export default StatusBadge;