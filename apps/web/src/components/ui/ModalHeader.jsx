import PropTypes from 'prop-types';

function ModalHeader({ icon, title, description }) {
    return (
        <div className="p-6 md:p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700">
                    {icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    );
}

ModalHeader.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default ModalHeader;