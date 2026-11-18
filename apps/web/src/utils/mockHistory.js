export const mockHistoryData = [
  {
    id: 'hist-1',
    date: '28 / 10 / 2026',
    time: '16:30 WIB',
    type: 'Stok Opname',
    items: [
      { id: '1', name: 'Pupuk Urea 50 kg', sku: 'PUP-URE-001', systemStock: 98, physicalStock: 96, diff: -2, reason: 'Rusak', notes: 'Kadalowarso' },
      { id: '2', name: 'Insektisida Regent 100 mL', sku: 'PES-REG-001', systemStock: 32, physicalStock: 31, diff: -1, reason: 'Retur', notes: 'Retur pembeli' },
      { id: '3', name: 'Sprayer Elektrik 16 L', sku: 'ALT-SPR-001', systemStock: 9, physicalStock: 10, diff: 1, reason: 'Restok', notes: 'Unit display dialihkan ke stok operasional' },
      { id: '4', name: 'Benih Padi Inpari-32 5 kg', sku: 'BNH-PAD-001', systemStock: 23, physicalStock: 23, diff: 0, reason: 'Lengkap', notes: '-' },
    ]
  },
  {
    id: 'hist-2',
    date: '15 / 10 / 2026',
    time: '11:15 WIB',
    type: 'Import File Stok',
    items: [
      { id: '5', name: 'Pupuk NPK Phonska 50 kg', sku: 'NPK-PHO-002', systemStock: 120, physicalStock: 120, diff: 0, reason: 'Restok', notes: 'Import dari supplier' },
    ]
  },
  {
    id: 'hist-3',
    date: '30 / 09 / 2026',
    time: '17:00 WIB',
    type: 'Catat Stok Manual',
    items: [
      { id: '6', name: 'Pupuk KCI 50 kg', sku: 'PUP-KCI-004', systemStock: 30, physicalStock: 28, diff: -2, reason: 'Rusak', notes: 'Kemasan sobek' },
    ]
  }
];