import React from 'react';

interface InputFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  isTextarea?: boolean;
  isReadOnly?: boolean;
  rows?: number;
  maxLength?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  isTextarea = false,
  isReadOnly = false,
  rows = 3,
  maxLength,
}) => {
  const commonProps = {
    id,
    value,
    onChange,
    placeholder,
    readOnly: isReadOnly,
    className: `w-full bg-gray-900/50 text-gray-200 p-3 rounded-md border-2 border-gray-700 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 ${isReadOnly ? 'cursor-default' : ''}`,
  };

  const showCounter = maxLength && !isReadOnly;
  const showReadOnlyCounter = maxLength && isReadOnly;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {isTextarea ? (
          <textarea {...commonProps} rows={rows} maxLength={maxLength}></textarea>
        ) : (
          <input type="text" {...commonProps} maxLength={maxLength} />
        )}
        {showCounter && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {value.length} / {maxLength}
          </div>
        )}
        {showReadOnlyCounter && (
           <div className="absolute top-2 right-2 text-xs text-gray-500">
            {value.length} / {maxLength}
          </div>
        )}
      </div>
    </div>
  );
};
