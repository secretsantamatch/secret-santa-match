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
    id: 'questionnaire',
    type: 'Free Download',
    title: 'Free Secret Santa Questionnaire',
    description: "The perfect companion for your gift exchange! This fun, printable questionnaire helps everyone get the perfect gift. Download, print, and share to make this year's gifting easy and thoughtful.",
    thumbnailUrl: '/posts/secret_santa_questionnaire_thumbnail.png',
    linkUrl: '/secret-santa-questionnaire.html',
  },
  // Future resources like blog posts can be easily added here
];
