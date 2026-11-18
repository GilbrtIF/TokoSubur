function TablePagination() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-6 px-2 text-sm text-gray-500">
      <p>Showing <span className="font-medium text-gray-900">1-10</span> of <span className="font-medium text-gray-900">48</span> SKUs</p>
      
      <div className="flex items-center gap-2 mt-4 md:mt-0">
        <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-black text-white font-medium">1</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 font-medium">2</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 font-medium">3</button>
        <span className="px-2">...</span>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 font-medium">5</button>
        <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50">Next</button>
      </div>
    </div>
  );
}

export default TablePagination;