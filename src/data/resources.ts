
export interface Resource {
  id: string;
  type: 'Free Download' | 'Guide & Tips' | 'Article' | 'Guide & Printable';
  title: string;
  description: string;
  thumbnailUrl: string;
  linkUrl: string;
  lastUpdated?: string;
}
