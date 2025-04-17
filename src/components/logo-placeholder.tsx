'use client';

import Image from 'next/image';

export default function LogoPlaceholder() {
  return (
    <div className="flex items-center">
      <div className="h-10 w-auto">
        <Image
          src="/images/logo.png"
          alt="etracking logo"
          width={500}
          height={500}
          className="h-full w-auto object-contain"
          style={{ maxHeight: '40px' }}
        />
      </div>
    </div>
  );
}
