'use client';

import { useState, useEffect } from 'react';
import { dictionaryService } from '../lib/dictionary-service';

export default function DictionaryManager() {
  const [entries, setEntries] = useState<{ from: string; to: string }[]>([]);
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');

  useEffect(() => {
    // Load dictionary entries when component mounts
    setEntries(dictionaryService.getAllEntries());
  }, []);

  const handleAddEntry = () => {
    if (newFrom && newTo) {
      dictionaryService.addEntry(newFrom, newTo);
      setEntries(dictionaryService.getAllEntries());
      setNewFrom('');
      setNewTo('');
    }
  };

  const handleRemoveEntry = (from: string) => {
    dictionaryService.removeEntry(from);
    setEntries(dictionaryService.getAllEntries());
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Từ điển thay thế</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newFrom}
          onChange={(e) => setNewFrom(e.target.value)}
          placeholder="Từ gốc"
          className="flex-1 p-2 border rounded"
        />
        <input
          type="text"
          value={newTo}
          onChange={(e) => setNewTo(e.target.value)}
          placeholder="Thay thế bằng"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleAddEntry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thêm
        </button>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.from} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <span className="font-medium">{entry.from}</span>
              <span className="mx-2">→</span>
              <span>{entry.to}</span>
            </div>
            <button
              onClick={() => handleRemoveEntry(entry.from)}
              className="px-2 py-1 text-red-500 hover:text-red-600"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 