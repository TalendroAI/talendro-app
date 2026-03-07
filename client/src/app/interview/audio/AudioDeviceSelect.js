import React from 'react';
import { RefreshCw } from 'lucide-react';

export function AudioDeviceSelect({
  label = 'Microphone',
  devices,
  value,
  onValueChange,
  onRefresh,
  disabled,
  isRefreshing,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={disabled || isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </button>
      </div>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select a microphone</option>
        {(devices || []).filter((d) => d.deviceId).map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        If Sarah can't hear you, pick your headset mic here and try again.
      </p>
    </div>
  );
}

export default AudioDeviceSelect;
