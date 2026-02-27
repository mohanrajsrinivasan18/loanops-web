'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Collections is now merged into Lines page
export default function CollectionsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/lines'); }, [router]);
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-neutral-500">Redirecting to Lines & Collections...</p>
    </div>
  );
}
