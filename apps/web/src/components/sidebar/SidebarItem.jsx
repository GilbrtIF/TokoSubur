import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';

function SidebarItem({ icon, label, path }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-black text-white' // Style saat aktif (hitam)
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Style saat tidak aktif
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Ikon akan berwarna hijau limau jika aktif, abu-abu jika tidak */}
          <span className={isActive ? 'text-[#C6F25E]' : 'text-gray-400'}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

SidebarItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
};

export default SidebarItem;