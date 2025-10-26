'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Percent, Calendar, Settings, FileText, Edit3 } from 'lucide-react';

interface InterestPreset {
  days: number;
  rate: number;
}

interface InterestPresetSettingsProps {
  interestPresets: InterestPreset[];
  maxLateDays: number;
  templateName: string;
  dailyInterestRate?: number;
  onInterestPresetsChange: (presets: InterestPreset[]) => void;
  onMaxLateDaysChange: (days: number) => void;
  onTemplateNameChange: (name: string) => void;
  onDailyInterestRateChange?: (rate: number) => void;
}

export default function InterestPresetSettings({
  interestPresets,
  maxLateDays,
  templateName,
  dailyInterestRate = 0,
  onInterestPresetsChange,
  onMaxLateDaysChange,
  onTemplateNameChange,
  onDailyInterestRateChange,
}: InterestPresetSettingsProps) {
  const [isDailyInterest, setIsDailyInterest] = useState(dailyInterestRate > 0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [localTemplateName, setLocalTemplateName] = useState(templateName);
  const [localDailyInterestRate, setLocalDailyInterestRate] = useState(dailyInterestRate);

  // Default presets if none provided
  const defaultPresets: InterestPreset[] = [
    { days: 7, rate: 3 },
    { days: 15, rate: 5 },
    { days: 30, rate: 10 }
  ];

  const [presets, setPresets] = useState<InterestPreset[]>(
    interestPresets.length > 0 ? interestPresets : defaultPresets
  );

  const [localMaxLateDays, setLocalMaxLateDays] = useState(maxLateDays || 7);

  useEffect(() => {
    onInterestPresetsChange(presets);
  }, [presets, onInterestPresetsChange]);

  useEffect(() => {
    onMaxLateDaysChange(localMaxLateDays);
  }, [localMaxLateDays, onMaxLateDaysChange]);

  useEffect(() => {
    onTemplateNameChange(localTemplateName);
  }, [localTemplateName, onTemplateNameChange]);

  useEffect(() => {
    if (onDailyInterestRateChange) {
      onDailyInterestRateChange(isDailyInterest ? localDailyInterestRate : 0);
    }
  }, [isDailyInterest, localDailyInterestRate, onDailyInterestRateChange]);

  const handleDailyInterestToggle = (checked: boolean) => {
    setIsDailyInterest(checked);
    if (!checked) {
      setLocalDailyInterestRate(0);
    }
  };

  const addPreset = () => {
    setPresets([...presets, { days: 0, rate: 0 }]);
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Interest Preset</h2>
            <p className="text-sm text-gray-600 mt-1">รูปแบบอัตราดอกเบี้ย</p>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={isDailyInterest}
                onChange={(e) => handleDailyInterestToggle(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">คิดดอกเบี้ยแบบรายวัน</span>
            </label>
            {isDailyInterest && (
              <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                กรุณาตั้งค่าอัตราดอกเบี้ยต่อวันด้านล่าง
              </div>
            )}
          </div>
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

        {/* Daily Interest Rate Field - Show only when checkbox is checked */}
        {isDailyInterest && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Daily Interest Rate (%)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={localDailyInterestRate || ''}
                onChange={(e) => setLocalDailyInterestRate(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="0.025"
                step="0.001"
                min="0"
                max="1"
              />
              <span className="text-sm text-blue-700 font-medium">% ต่อวัน</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              อัตราดอกเบี้ยที่คิดต่อวัน (เช่น 0.025 = 0.025% ต่อวัน)
            </p>
          </div>
        )}

        {/* Add Period Button */}
        <button
          onClick={addPreset}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          เพิ่มช่วงเวลา
        </button>
      </div>

      {/* Max Late Days Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              จำนวนวันล่าช้าสูงสุด
            </label>
            <p className="text-xs text-gray-500 mb-3">
              สัญญาจะถูกระงับเองถ้าเลยจำนวนวันที่กำหนด
            </p>
            <input
              type="number"
              value={localMaxLateDays}
              onChange={(e) => setLocalMaxLateDays(parseInt(e.target.value) || 0)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
              max="365"
              placeholder="7"
            />
          </div>
        </div>
      </div>

      {/* Template Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Template name
            </h3>
            <p className="text-sm text-gray-600 mt-1">ชื่อแบบฟอร์มสัญญา</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              {localTemplateName || 'สัญญารูปแบบมาตรฐาน 1'}
            </span>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Template
            </button>
          </div>
        </div>
      </div>

      {/* Template Edit Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">แก้ไขชื่อแบบฟอร์ม</h3>
            <input
              type="text"
              value={localTemplateName}
              onChange={(e) => setLocalTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
              placeholder="ชื่อแบบฟอร์มสัญญา"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                บันทึก
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
