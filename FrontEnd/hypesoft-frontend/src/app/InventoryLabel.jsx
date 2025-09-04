'use client'; 

import { useEffect, useState } from 'react';

export default function InventoryLabel({ locale = 'pt' }) {
  const [text, setText] = useState(''); // valor inicial neutro

  useEffect(() => {
    // Atualiza só no cliente
    if (locale === 'en') {
      setText('Inventory');
    } else if (locale === 'pt') {
      setText('Inventário');
    } else {
      setText('Inventory'); // fallback
    }
  }, [locale]);

  return <div>{text}</div>;
}
