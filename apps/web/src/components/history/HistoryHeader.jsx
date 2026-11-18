import { ArrowLeft } from 'lucide-react';
import { Link } from 'lucide-react';

function HistoryHeader() {
    return (
        <div className="mb-6">
            {/* Breadcrumb */}
            <div className='text-sm text-gray-500 mb-6 flex items-center gap-2'>
                <span>Workspace</span>
                <span>/</span>
                <span>inventory</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">Riwayat Stok</span>
            </div>
            
            {/* Title & Action */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Riwayat Stok</h1>
                <p className="text-sm text-gray-500">
                    Melihat riwayat perubahan stok, termasuk restok, barang rusak, retur, dan hasil stok opname
                </p>
                </div>
                
                <Link 
                to="/inventory"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors w-max"
                >
                <ArrowLeft size={16} /> Kembali ke Manajemen Stok
                </Link>
            </div>
        </div>
    );
}

export default HistoryHeader;