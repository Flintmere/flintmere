import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#F8BF24',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 100 100" width="72%" height="72%">
          <path fill="#0A0A0A" d="M18 20 H56 V32 H30 V44 H50 V54 H30 V80 H18 Z" />
          <path fill="#0A0A0A" d="M64 20 H84 V80 H64 V68 H72 V32 H64 Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
