import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2563eb',
          borderRadius: '112px', // Soft rounded squircle for modern browsers
        }}
      >
        <svg width="240" height="280" viewBox="0 0 240 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Home Plate Background */}
          <path d="M 0 0 L 240 0 L 240 160 L 120 280 L 0 160 Z" fill="white" />
          {/* Lineup Sheet Lines */}
          <line x1="60" y1="60" x2="180" y2="60" stroke="#2563eb" strokeWidth="24" strokeLinecap="round" />
          <line x1="60" y1="120" x2="180" y2="120" stroke="#2563eb" strokeWidth="24" strokeLinecap="round" />
          <line x1="60" y1="180" x2="140" y2="180" stroke="#2563eb" strokeWidth="24" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}