import HistoryHeader from '../components/history/HistoryHeader';
import HistoryFilters from '../components/history/HistoryFilters';
import HistoryGroup from '../components/history/HistoryGroup';
import { mockHistoryData } from '../utils/mockHistory';

function StockHistoryPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <HistoryHeader />
      <HistoryFilters />
      
      {/* List Riwayat */}
      <div className="flex flex-col">
        {mockHistoryData.map((group, index) => (
          <HistoryGroup 
            key={group.id}
            date={group.date}
            time={group.time}
            type={group.type}
            items={group.items}
            defaultOpen={index === 0} // Buka accordion pertama secara default
          />
        ))}
      </div>
    </div>
  );
}

export default StockHistoryPage;