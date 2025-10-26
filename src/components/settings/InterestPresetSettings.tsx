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
  onInterestPresetsChange: (presets: InterestPreset[]) => void;
  onMaxLateDaysChange: (days: number) => void;
  onTemplateNameChange: (name: string) => void;
}

export default function InterestPresetSettings({
  interestPresets,
  maxLateDays,
  templateName,
  onInterestPresetsChange,
  onMaxLateDaysChange,
  onTemplateNameChange,
}: InterestPresetSettingsProps) {
  const [isDailyInterest, setIsDailyInterest] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [localTemplateName, setLocalTemplateName] = useState(templateName);

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Interest Preset</h2>
            <p className="text-sm text-gray-600 mt-1">รูปแบบอัตราดอกเบี้ย</p>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDailyInterest}
              onChange={(e) => setIsDailyInterest(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">คิดดอกเบี้ยแบบรายวัน</span>
          </label>
        </div>

        {/* Preset Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {presets.map((preset, index) => (
            <div key={index} className="relative">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                {/* Days Label */}
                <div className="text-center mb-3">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-gray-700">{preset.days}</span>
                  </div>
                  <span className="text-xs text-gray-500">{preset.days}วัน</span>
                </div>

                {/* Rate Input */}
                <div className="flex items-center justify-center">
                  <div className="relative flex-1 max-w-24">
                    <input
                      type="number"
                      value={preset.rate || ''}
                      onChange={(e) => updatePreset(index, 'rate', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 text-center border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        validatePreset(preset) ? 'border-gray-300' : 'border-red-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <Percent className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                {presets.length > 1 && (
                  <button
                    onClick={() => removePreset(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    aria-label={`ลบช่วงเวลา ${preset.days} วัน`}
                  >
                    <Trash2 className="w-3 h-3" />
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
