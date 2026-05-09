"use client";

import React from 'react';

interface JsonLdProps {
  data: any;
}

/**
 * Reusable component to inject JSON-LD structured data into the page.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
