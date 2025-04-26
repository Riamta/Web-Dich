'use client';

import React, { Fragment, useRef, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'full': 'max-w-full'
};

export function Modal({ isOpen, onClose, children, className, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className={cn(
        "relative bg-white rounded-lg shadow-lg w-full mx-4",
        sizeClasses[size],
        className
      )}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between p-4 border-b", className)}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 p-4 border-t", className)}>
      {children}
    </div>
  );
}

export function ModalOverlay() {
  // This is just a dummy component for compatibility
  // The overlay is built into the Modal component
  return null;
}

export interface ModalContentProps {
  children: React.ReactNode;
  height?: string;
}

export function ModalContent({ children, height }: ModalContentProps) {
  return (
    <div className={`flex flex-col ${height ? height : 'max-h-[90vh]'}`}>
      {children}
    </div>
  );
}

export function ModalCloseButton() {
  return (
    <button
      className="p-2 text-gray-400 hover:text-gray-500"
      onClick={(e) => {
        e.stopPropagation();
        const modal = e.currentTarget.closest('[role="dialog"]');
        if (modal) {
          const closeEvent = new CustomEvent('close');
          modal.dispatchEvent(closeEvent);
        }
      }}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// Default export for easier imports
export default Modal; 