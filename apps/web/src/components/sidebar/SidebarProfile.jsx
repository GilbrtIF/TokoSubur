function SidebarProfile() {
  return (
    <div className="mt-auto border-t border-gray-100 pt-4">
      <button className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-xl transition-colors text-left">
        {/* Avatar */}
        <div className="w-9 h-9 bg-[#C6F25E] rounded-lg flex items-center justify-center font-bold text-black text-sm">
          FZ
        </div>
        {/* Info User */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Fauzi</p>
        </div>
        {/* Ikon Titik Tiga */}
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
    </div>
  );
}

export default SidebarProfile;