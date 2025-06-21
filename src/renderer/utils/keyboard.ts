// Keyboard utilities for cross-platform shortcut handling

export const isMac = () => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

export const getModifierKey = () => {
  return isMac() ? 'metaKey' : 'ctrlKey';
};

export const getModifierKeyName = () => {
  return isMac() ? '⌘' : 'Ctrl';
};

export interface KeyboardShortcut {
  key: string;
  modifierKey: 'metaKey' | 'ctrlKey';
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export const handleKeyboardShortcut = (
  event: KeyboardEvent,
  shortcuts: KeyboardShortcut[]
): boolean => {
  for (const shortcut of shortcuts) {
    if (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      event[shortcut.modifierKey] &&
      !event.shiftKey &&
      !event.altKey
    ) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.handler(event);
      return true;
    }
  }
  return false;
};