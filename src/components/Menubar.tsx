'use client';

import { useEffect, useState } from 'react';
import { LOCAL_AI_MODELS, OPENROUTER_MODELS } from '@/lib/api-config';
import { aiService } from '@/lib/ai-service';
import { CommandLineIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useSidebar } from '@/contexts/SidebarContext';
import GoogleLoginButton from './GoogleLoginButton';

export default function Menubar() {
  const [selectedModel, setSelectedModel] = useState(aiService.getModel());
  const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
  const { toggle } = useSidebar();

  useEffect(() => {
    aiService.loadSavedModel();
    setSelectedModel(aiService.getModel());
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    aiService.setModel(modelId);
    setIsModelSelectOpen(false);
  };

  // Combine all AI models
  const ALL_AI_MODELS = [
    ...LOCAL_AI_MODELS,
    { id: 'separator', name: '──────────', description: '' },
    ...OPENROUTER_MODELS,
  ];

  const currentModel = ALL_AI_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="relative h-14 bg-white border-b border-gray-200 px-3 sm:px-4 flex items-center justify-between z-40">
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        <button
          onClick={toggle}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Mobile Model Display */}
        <div className="flex items-center gap-2 flex-1 min-w-0 md:hidden">
          <CommandLineIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <button
            onClick={() => setIsModelSelectOpen(!isModelSelectOpen)}
            className="text-sm font-medium text-gray-700 truncate flex-1 text-left"
          >
            {currentModel?.name || 'Select Model'}
          </button>
        </div>

        {/* Desktop Model Select */}
        <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
          <CommandLineIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <label htmlFor="ai-model" className="text-sm font-medium text-gray-700 whitespace-nowrap">
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

          {selectedModel && (
            <p className="text-xs text-gray-500 truncate">
              {currentModel?.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center ml-4">
        <GoogleLoginButton />
      </div>

      {/* Mobile Model Select Dropdown */}
      {isModelSelectOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 mx-3 bg-white border border-gray-200 rounded-lg shadow-lg md:hidden">
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {ALL_AI_MODELS.map((model) => (
              model.id === 'separator' ? (
                <div key={model.id} className="px-3 py-1 text-xs text-gray-400 font-bold border-t border-gray-100">
                  {model.name}
                </div>
              ) : (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={`w-full px-3 py-2 text-left text-sm ${
                    model.id === selectedModel
                      ? 'bg-primary/5 text-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{model.name}</div>
                  {model.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                  )}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 