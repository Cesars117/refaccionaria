export default function BulkEntry() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-red-600 mb-6">🚨 Urgent Data Recovery</h1>
      
      <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">⚠️ Data lost during migration</h2>
        <p className="text-red-700">125 inventory items were lost. Use this form for quick re-entry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick single-item entry */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">📝 Quick Single Entry</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item name</label>
              <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                  <option value="AVAILABLE">Available</option>
                  <option value="IN_USE">In use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              ➕ Add Item
            </button>
          </form>
        </div>

        {/* Bulk CSV entry */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">📄 Bulk Entry (CSV)</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV format (name,sku,category,location,status):
            </label>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>Taladro DeWalt,DW001,Electric-Tool,8 Floor NRG,AVAILABLE</div>
              <div>Ethernet Cable,ETH001,Cable,Main Warehouse,AVAILABLE</div>
              <div>Hammer,MAR001,Manual-Tool,8 Floor NRG,IN_USE</div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Paste CSV data</label>
            <textarea 
              rows={10} 
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
              placeholder="Paste your CSV data here..."
            />
          </div>
          
          <button type="button" className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
            📊 Process CSV
          </button>
        </div>
      </div>
      
      {/* Pending items list */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">📋 Pending Item List</h3>
        <div className="text-gray-500">Items will appear here before confirmation...</div>
      </div>
      
      {/* Existing categories and locations */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">📂 Existing categories:</h4>
          <div className="text-sm text-blue-600 mt-2">
            Electric-Tool • Manual-Tool • Material
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">📍 Existing locations:</h4>
          <div className="text-sm text-green-600 mt-2">
            8 Floor NRG • Astrodome • Memorial • Center NRG
          </div>
        </div>
      </div>
    </div>
  );
}