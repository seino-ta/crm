'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';

import { Input } from './input';
import { Select } from './select';

type BaseProps = {
  label: string;
  helperText?: string;
  containerClassName?: string;
};

const labelBase =
  'pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white px-1 text-sm font-semibold uppercase tracking-wide text-slate-500 transition-all duration-150';
const labelFocus = 'peer-focus:top-0 peer-focus:-translate-y-[0.35rem] peer-focus:text-[11px] peer-focus:text-blue-600';
const labelInputFilled =
  'peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-[0.35rem] peer-[&:not(:placeholder-shown)]:text-[11px]';
const labelSelectFilled = "peer-data-[filled='true']:top-0 peer-data-[filled='true']:-translate-y-[0.35rem] peer-data-[filled='true']:text-[11px]";

function RequiredMark() {
  return <span className="ml-1 text-rose-500">*</span>;
}

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).length > 0;
}

export type FloatingInputProps = React.ComponentPropsWithoutRef<typeof Input> & BaseProps & {
  example?: string;
};

export function FloatingInput({
  label,
  helperText,
  containerClassName,
  className,
  id: idProp,
  example,
  placeholder,
  required,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...rest
}: FloatingInputProps) {
  const autoId = useId();
  const id = idProp ?? rest.name ?? `floating-input-${autoId}`;
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(String(defaultValue ?? ''));
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const exampleText = example ?? placeholder ?? '';
  const currentValue = isControlled ? value : uncontrolledValue;
  const filled = isFilled(currentValue);
  const showError = required && touched && !filled;
	const placeholderText = isFocused && exampleText ? exampleText : ' ';

	useEffect(() => {
		if (!isControlled) {
			setUncontrolledValue(String(defaultValue ?? ''));
			setTouched(false);
		}
	}, [defaultValue, isControlled]);

  return (
    <div className={clsx('relative', containerClassName)}>
      <Input
        {...rest}
        id={id}
        required={required}
        value={isControlled ? value : undefined}
        defaultValue={!isControlled ? defaultValue : undefined}
        onChange={(event) => {
          if (!isControlled) {
            setUncontrolledValue(event.currentTarget.value);
          }
          if (!touched) {
            setTouched(true);
          }
          onChange?.(event);
        }}
        placeholder={placeholderText}
        className={clsx(
          'peer placeholder-transparent focus:placeholder-slate-400 focus-visible:placeholder-slate-400',
          showError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : '',
          className
        )}
        aria-invalid={showError ? true : undefined}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          setTouched(true);
          onBlur?.(event);
        }}
      />
      <label htmlFor={id} className={clsx(labelBase, labelFocus, labelInputFilled)}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

export type FloatingSelectProps = React.ComponentPropsWithoutRef<typeof Select> & BaseProps & {
  forceFloatLabel?: boolean;
};

export function FloatingSelect({
  label,
  helperText,
  containerClassName,
  className,
  id: idProp,
  required,
  children,
  value,
  defaultValue,
  onChange,
  onBlur,
  forceFloatLabel,
  ...rest
}: FloatingSelectProps) {
  const autoId = useId();
  const id = idProp ?? rest.name ?? `floating-select-${autoId}`;
  const isControlled = value !== undefined;
  const initialValue = isControlled ? value : defaultValue;
  const [filled, setFilled] = useState(() => isFilled(initialValue));
  const [touched, setTouched] = useState(false);
  const showError = required && touched && !filled;

  useEffect(() => {
    if (isControlled) {
      setFilled(isFilled(value));
    } else {
      setFilled(isFilled(defaultValue));
    }
  }, [defaultValue, isControlled, value]);
  useEffect(() => {
    if (!isControlled) {
      setTouched(false);
    }
  }, [defaultValue, isControlled]);

  return (
    <div className={clsx('relative', containerClassName)}>
      <Select
        {...rest}
        id={id}
        required={required}
        value={isControlled ? value : undefined}
        defaultValue={!isControlled ? (defaultValue as string | number | string[] | undefined) : undefined}
        onChange={(event) => {
          if (!isControlled) {
            setFilled(isFilled(event.currentTarget.value));
          }
          if (!touched) {
            setTouched(true);
          }
          onChange?.(event);
        }}
        onBlur={(event) => {
          setTouched(true);
          onBlur?.(event);
        }}
        data-filled={filled || forceFloatLabel ? 'true' : 'false'}
        className={clsx(
          'peer appearance-none',
          showError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : '',
          className
        )}
        aria-invalid={showError ? true : undefined}
      >
        {children}
      </Select>
      <label htmlFor={id} className={clsx(labelBase, labelFocus, labelSelectFilled)}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

/* eslint-enable react-hooks/set-state-in-effect */
