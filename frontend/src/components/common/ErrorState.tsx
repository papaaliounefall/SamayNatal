import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = "Impossible de charger ces données.", onRetry }) => (
  <div className="border-2 border-dashed border-red-200 rounded-2xl p-12 text-center bg-red-50/40">
    <div className="w-12 h-12 rounded-full bg-white border border-red-200 flex items-center justify-center text-red-500 mx-auto mb-3">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <p className="text-sm font-semibold text-[#111827]">{message}</p>
    <p className="text-xs text-[#6B7280] mt-1">Vérifiez votre connexion et réessayez.</p>
    <div className="mt-4">
      <Button variant="secondary" size="sm" onClick={onRetry} icon={<RotateCw className="w-3.5 h-3.5" />}>
        Réessayer
      </Button>
    </div>
  </div>
);
