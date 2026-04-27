'use client';

import { useState } from 'react';
import { exportToCSV, createManualBackup } from '@/app/actions';

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportToCSV();
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', result.filename || 'inventory.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessage(`✅ CSV exported successfully (${result.count} items)`);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error exporting: ${error}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await createManualBackup();
      if (result.success && result.counts) {
        setMessage(
          `✅ Backup created successfully
📊 ${result.counts.items} items
📂 ${result.counts.categories} categories  
📍 ${result.counts.locations} locations
📁 Saved to: backups/`
        );
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error creating backup: ${error}`);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setMessage(''), 10000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🛡️ Backup and Data Protection</h1>
        <p className="text-gray-600">Backup system to protect your inventory data</p>
      </div>

      {/* Status message */}
      {message && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm text-blue-800">{message}</pre>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export CSV */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center mb-4">
            <div className="text-2xl mr-3">📤</div>
            <h3 className="text-xl font-semibold">Export CSV</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Download all items in CSV format to keep a local copy
          </p>
          
          <div className="bg-gray-50 p-3 rounded text-sm mb-4">
            <strong>Includes:</strong><br/>
            • Name, SKU, description<br/>
            • Status, category, location<br/>
            • Creation date
          </div>
          
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? '🔄 Exporting...' : '📥 Download CSV'}
          </button>
        </div>

        {/* Full backup */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center mb-4">
            <div className="text-2xl mr-3">💾</div>
            <h3 className="text-xl font-semibold">Full Backup</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Create a full backup with database structure for restoration
          </p>
          
          <div className="bg-gray-50 p-3 rounded text-sm mb-4">
            <strong>Includes:</strong><br/>
            • All items with IDs<br/>
            • Categories and locations<br/>
            • Automatic restore script
          </div>
          
          <button
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBackingUp ? '🔄 Creating backup...' : '💾 Create Backup'}
          </button>
        </div>
      </div>

      {/* Additional information */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Automatic backup */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center mb-3">
            <div className="text-2xl mr-3">⏰</div>
            <h4 className="text-lg font-semibold text-yellow-800">Automatic Backup</h4>
          </div>
          <p className="text-yellow-700 text-sm mb-3">
            The system creates backups automatically every day to protect your data.
          </p>
          <div className="text-xs text-yellow-600">
            📁 Location: <code>/backups/backup-YYYY-MM-DD.json</code>
          </div>
        </div>

        {/* Safe procedures */}
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="flex items-center mb-3">
            <div className="text-2xl mr-3">⚠️</div>
            <h4 className="text-lg font-semibold text-red-800">Safe Procedures</h4>
          </div>
          <p className="text-red-700 text-sm mb-3">
            ALWAYS create a backup before:
          </p>
          <ul className="text-xs text-red-600 space-y-1">
            <li>• Database migrations</li>
            <li>• System updates</li>
            <li>• Schema changes</li>
            <li>• Production deployment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}