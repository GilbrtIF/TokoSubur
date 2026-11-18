import { Calendar, ChevronDown, Download } from "lucide-react";

function HistoryFilters() {
    return (
        <div className="bg-white p-4 rounded-2x1 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0,.02)] flex felx-col md: flex-row items-end gap-4 mb-6">
            {/* Cari tanggal */}
            <div className="w-full md:w-1/3">
             <label className="text-[11px] font-bold text-gray-500 uppercase traking-wider mb-2 block">Cari tanggal</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                    type="text"
                    placeholder="Pilih rentang tanggal"
                    className="w-full bg-[#FAF9F6] text-sm text-gray-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#C6F25E] cursor-pointer"
                    readOnly
                    />
                </div>
            </div>

            {/* Jenis Aktivitas */}
            <div className="w-full md:w-1/3">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Jenis Aktivitas</label>
                    <div className="relative">
                        <select className="w-full bg-[#FAF9F6] text-sm text-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#C6F25E] appearance-none cursor-pointer">
                            <option>Semua Jenis Aktivitas</option>
                            <option>Stock Opname</option>
                            <option>Import File Stok</option>
                            <option>Catat Stok Manual</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
               </div>

               {/* Tombol Export */}
               <div className="W-full md:w-auto">
                    <button className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <Download size={16} /> Export Rekap
                    </button>
               </div>
        </div>
    );
}

export default HistoryFilters;