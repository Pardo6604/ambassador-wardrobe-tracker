import React from 'react';
import '../index.css';

export interface Metadata {
  title: string;
  description: string;
}

export const metadata: Metadata = {
  title: 'ClosetPR - Ambassador Wardrobe & Seeded Item Tracker',
  description: 'Minimalist digital wardrobe for fashion and brand ambassadors to manage PR gifts, seeded items, campaign outfits, and delivery statuses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF9F6] text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
