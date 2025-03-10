'use client';

import { useEffect, useState } from 'react';
import { LOCAL_AI_MODELS, OPENROUTER_MODELS } from '@/lib/api-config';
import { aiService } from '@/lib/ai-service';
import { CommandLineIcon } from '@heroicons/react/24/outline';

export default function Menubar() {
  const [selectedModel, setSelectedModel] = useState(aiService.getModel());

  useEffect(() => {
    aiService.loadSavedModel();
    setSelectedModel(aiService.getModel());
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    aiService.setModel(modelId);
  };

  // Combine all AI models
  const ALL_AI_MODELS = [
    ...LOCAL_AI_MODELS,
    { id: 'separator', name: '──────────', description: '' },
    ...OPENROUTER_MODELS,
  ];

  return (
    <div className="fixed top-0 left-20 right-0 h-14 bg-white border-b border-gray-200 px-4 flex items-center z-40">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="h-5 w-5 text-gray-400" />
          <label htmlFor="ai-model" className="text-sm font-medium text-gray-700">
            AI Model
          </label>
          <select
            id="ai-model"
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-60 p-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/50"
          >
            {ALL_AI_MODELS.map((model) => (
              <option
                key={model.id}
                value={model.id}
                disabled={model.id === 'separator'}
                className={model.id === 'separator' ? 'text-gray-400 font-bold' : ''}
              >
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {selectedModel && (
          <p className="text-xs text-gray-500">
            {ALL_AI_MODELS.find((m) => m.id === selectedModel)?.description}
          </p>
        )}
      </div>
    </div>
  );
} 