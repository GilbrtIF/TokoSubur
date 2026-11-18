import PropTypes from 'prop-types';
import { ArrowRight } from 'lucide-react'; // Sesuaikan ikon

function ModalFooter({ onCancel, onSubmit, isSubmitting, submitText = 'Simpan dan Selesaikan' }) {
  return (
    <div className="p-4 md:p-6 border-t border-gray-100 flex items-center justify-between bg-white">
      <button 
        onClick={onCancel}
        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50"
      >
        Kembali ke Manajemen Stok
      </button>
      
      <button 
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-black rounded-full hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? 'Menyimpan...' : submitText}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

ModalFooter.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  submitText: PropTypes.string,
};

export default ModalFooter;