import type { Messages } from './messages';

type TranslateOptions = {
  fallback?: string;
  values?: Record<string, string | number>;
};

function getByPath(obj: Record<string, unknown>, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, token) => {
    const value = values[token];
    return value !== undefined ? String(value) : `{${token}}`;
  });
}

export function createTranslator(messages: Messages, namespace?: string) {
  return (key: string, options?: TranslateOptions | string) => {
    const fallback = typeof options === 'string' ? options : options?.fallback;
    const values = typeof options === 'string' ? undefined : options?.values;
    const path = namespace ? `${namespace}.${key}` : key;
    const value = getByPath(messages as Record<string, unknown>, path.split('.'));
    if (typeof value === 'string') return interpolate(value, values);
    return fallback ?? key;
  };
}
