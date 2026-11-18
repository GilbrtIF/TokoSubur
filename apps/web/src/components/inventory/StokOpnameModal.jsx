import Modal from '../ui/Modal';
import ModalHeader from '../ui/ModalHeader';
import ModalFooter from '../ui/ModalFooter';
import InventoryFilterBar from './InventoryFilterBar';
import OpnameTable from './OpnameTable'; // Tabel khusus opname
import { ClipboardList, CheckCircle2 } from 'lucide-react';

function StokOpnameModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* 1. Header */}
      <ModalHeader 
        icon={<ClipboardList size={18} />}
        title="Stok Opname"
        description="Catat dan sesuaikan stok fisik dengan stok sistem Anda."
      />

      {/* 2. Filter Tanggal & Pencarian */}
      <InventoryFilterBar 
        dateLabel="Tanggal Opname" 
        searchLabel="Cari Produk / SKU" 
      />

      {/* 3. Konten Utama (Tabel & Summary) */}
      <div className="flex-1 overflow-y-auto p-6 md:px-8">
        <OpnameTable />
        
        {/* Summary Box (Bisa dijadikan komponen terpisah: SummaryBox.jsx) */}
        <div className="mt-4 bg-[#F4F9E8] border border-[#C6F25E]/30 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="text-[#6B8E23] mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-[#4A5D23]">2 Produk mempunyai selisih</p>
            <p className="text-xs text-[#6B8E23]">Pastikan jumlah fisik sudah sesuai untuk menghindari data stok yang tidak akurat.</p>
          </div>
        </div>
      </div>

      {/* 4. Footer Actions */}
      <ModalFooter 
        onCancel={onClose} 
        onSubmit={() => console.log('Simpan Opname')} 
      />
    </Modal>
  );
}

export default StokOpnameModal;