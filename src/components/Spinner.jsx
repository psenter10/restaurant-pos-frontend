import React from 'react';

export default function Spinner({ className = 'w-5 h-5', tone = 'border-t-navy' }) {
  return <div className={`${className} border-2 border-line ${tone} rounded-full animate-spin`} />;
}
