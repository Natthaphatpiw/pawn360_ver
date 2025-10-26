'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Percent, Calendar, Settings, FileText, Edit3 } from 'lucide-react';

interface InterestPreset {
  days: number;
  rate: number;
}

interface InterestPresetSettingsProps {
  interestPresets: InterestPreset[];
  onInterestPresetsChange: (presets: InterestPreset[]) => void;
}

export default function InterestPresetSettings({
  interestPresets,
  onInterestPresetsChange,
}: InterestPresetSettingsProps) {
  const [showAddPresetModal, setShowAddPresetModal] = useState(false);
  const [newPresetDays, setNewPresetDays] = useState('');
  const [newPresetRate, setNewPresetRate] = useState('');

  // Default presets if none provided
  const defaultPresets: InterestPreset[] = [
    { days: 7, rate: 3 },
    { days: 15, rate: 5 },
    { days: 30, rate: 10 }
  ];

  const [presets, setPresets] = useState<InterestPreset[]>(
    interestPresets.length > 0 ? interestPresets : defaultPresets
  );

  useEffect(() => {
    onInterestPresetsChange(presets);
  }, [presets, onInterestPresetsChange]);

  const addPreset = () => {
    setShowAddPresetModal(true);
  };

  const handleAddPresetConfirm = () => {
    const days = parseInt(newPresetDays);
    const rate = parseFloat(newPresetRate);

    if (days > 0 && rate >= 0 && rate <= 100) {
      setPresets([...presets, { days, rate }]);
      setNewPresetDays('');
      setNewPresetRate('');
      setShowAddPresetModal(false);
    }
  };

  const handleAddPresetCancel = () => {
    setNewPresetDays('');
    setNewPresetRate('');
    setShowAddPresetModal(false);
  };

  const updatePreset = (index: number, field: 'days' | 'rate', value: number) => {
    const newPresets = [...presets];
    newPresets[index] = { ...newPresets[index], [field]: value };
    setPresets(newPresets);
  };

  const removePreset = (index: number) => {
    if (presets.length > 1) {
      setPresets(presets.filter((_, i) => i !== index));
    }
  };

  const validatePreset = (preset: InterestPreset): boolean => {
    return preset.days > 0 && preset.rate >= 0 && preset.rate <= 100;
  };

  const hasValidationErrors = presets.some(preset => !validatePreset(preset));

  return (
    <div className="space-y-6">
      {/* Main Interest Preset Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Interest Preset</h2>
          <p className="text-sm text-gray-600 mt-1">รูปแบบอัตราดอกเบี้ย</p>
        </div>

        {/* Preset Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {presets.map((preset, index) => (
            <div key={index} className="relative group">
              <div className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 transition-all duration-200 ${
                validatePreset(preset)
                  ? 'border-gray-200 hover:border-green-300 hover:shadow-md'
                  : 'border-red-300 bg-red-50'
              }`}>
                {/* Days Label */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-lg font-bold text-gray-800">{preset.days}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{preset.days} วัน</span>
                </div>

                {/* Rate Input */}
                <div className="flex items-center justify-center">
                  <div className="relative flex-1 max-w-28">
                    <input
                      type="number"
                      value={preset.rate || ''}
                      onChange={(e) => updatePreset(index, 'rate', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-3 text-center text-lg font-semibold border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        validatePreset(preset)
                          ? 'border-gray-300 bg-white hover:border-green-400'
                          : 'border-red-400 bg-red-50'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <Percent className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                {presets.length > 1 && (
                  <button
                    onClick={() => removePreset(index)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                    aria-label={`ลบช่วงเวลา ${preset.days} วัน`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Validation Error */}
              {!validatePreset(preset) && (
                <p className="text-xs text-red-600 mt-1 text-center">
                  กรุณาใส่ค่าที่ถูกต้อง
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Add Period Button */}
        <button
          onClick={addPreset}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          เพิ่มช่วงเวลา
        </button>
      </div>

      {/* Add Preset Modal */}
      {showAddPresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มช่วงเวลาใหม่</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนวัน
                </label>
                <input
                  type="number"
                  value={newPresetDays}
                  onChange={(e) => setNewPresetDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="เช่น 45"
                  min="1"
                  max="365"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัตราดอกเบี้ย (%)
                </label>
                <input
                  type="number"
                  value={newPresetRate}
                  onChange={(e) => setNewPresetRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="เช่น 8.5"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddPresetCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddPresetConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={!newPresetDays || !newPresetRate || parseInt(newPresetDays) <= 0 || parseFloat(newPresetRate) < 0 || parseFloat(newPresetRate) > 100}
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          disabled={hasValidationErrors}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
