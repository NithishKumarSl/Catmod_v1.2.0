import { useEffect, useState } from 'react';

const PREFIX = 'codepen-clone-';

export default function useLocalStorage(key, initialValue) {
  const prefixedKey = PREFIX + key;

  const [value, setValue] = useState(() => {
    const jsonValue = localStorage.getItem(prefixedKey);
    
    // Check if jsonValue is not null and is a valid JSON string
    if (jsonValue !== null) {
      try {
        return JSON.parse(jsonValue);
      } catch (error) {
        console.error(`Error parsing JSON from localStorage for key "${prefixedKey}":`, error);
        // Return initialValue if parsing fails
        return initialValue;
      }
    }

    // If initialValue is a function, call it to get the initial value
    if (typeof initialValue === 'function') {
      return initialValue();
    } else {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(prefixedKey, JSON.stringify(value));
  }, [prefixedKey, value]);

  return [value, setValue];
}