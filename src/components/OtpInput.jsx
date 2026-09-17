/**
 * OtpInput.jsx
 * Component nhập 6 ký tự OTP. Hỗ trợ paste, auto-focus next input, backspace.
 */

import React, { useRef, useEffect } from 'react';

const OTP_LENGTH = 6;

/**
 * @param {{ value: string, onChange: (val: string) => void, disabled?: boolean }} props
 */
export default function OtpInput({ value, onChange, disabled = false }) {
  const inputRefs = useRef([]);

  // BUG FIX: ''.padEnd(6, '') = '' vì fill string rỗng → không pad được → digits = []
  // Dùng Array.from để luôn tạo đúng 6 phần tử
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index, e) {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    onChange(newDigits.join(''));
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    // Tạo mảng 6 phần tử từ chuỗi paste
    const newDigits = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || '');
    onChange(newDigits.join(''));
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  return (
    <div className="otp-input-group">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          className={`otp-digit ${digit ? 'otp-digit-filled' : ''}`}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Ký tự OTP thứ ${index + 1}`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
