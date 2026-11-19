import React from 'react';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, type BreadcrumbEntry } from '@/lib/structuredData';

export type BreadcrumbItem = BreadcrumbEntry;

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Migas de pan" className="breadcrumbs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={item.url}>
              {index > 0 && <span className="sep">/</span>}
              {isLast ? (
                <span className="current" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.url}>{item.name}</Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}
