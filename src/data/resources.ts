
export interface Resource {
  id: string;
  type: 'Free Download' | 'Guide & Tips' | 'Article';
  title: string;
  description: string;
  thumbnailUrl: string;
  linkUrl: string;
}
