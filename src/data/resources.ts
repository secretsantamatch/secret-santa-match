export interface Resource {
  id: string;
  type: 'Free Download' | 'Guide & Tips' | 'Article';
  title: string;
  description: string;
  thumbnailUrl: string;
  linkUrl: string;
}

export const resources: Resource[] = [
  {
    id: 'how-to-organize',
    type: 'Guide & Tips',
    title: 'How to Organize a Secret Santa: A Complete Guide',
    description: "Your stress-free roadmap to planning the perfect gift exchange. Learn the 6 simple steps, common mistakes to avoid, and how to use free tools to make it easy.",
    thumbnailUrl: '/posts/secret_santa_questionnaire_thumbnail.png',
    linkUrl: '/how-to-organize-secret-santa.html',
  },
  {
    id: 'questionnaire',
    type: 'Free Download',
    title: 'Free Secret Santa Questionnaire',
    description: "The perfect companion for your gift exchange! This fun, printable questionnaire helps everyone get the perfect gift. Download, print, and share to make this year's gifting easy and thoughtful.",
    thumbnailUrl: '/posts/secret_santa_questionnaire_thumbnail.png',
    linkUrl: '/secret-santa-questionnaire.html',
  },
];
