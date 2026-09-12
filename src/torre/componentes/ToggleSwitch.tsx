import React from 'react';

interface PropsToggleSwitch {
  id?: string;
  enabled: boolean;
  onChange: () => void;
  colorActivo?: 'rojo' | 'cyan' | 'verde';
}

export const ToggleSwitch: React.FC<PropsToggleSwitch> = ({
  id,
  enabled,
  onChange,
  colorActivo = 'rojo',
}) => {
  const colorBg = enabled
    ? colorActivo === 'cyan'
      ? 'bg-cyan-600'
      : colorActivo === 'verde'
      ? 'bg-emerald-600'
      : 'bg-red-600'
    : 'bg-slate-700';

  return (
    <button
      id={id}
      type="button"
      className={`${colorBg} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
      onClick={onChange}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};
