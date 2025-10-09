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
    id: 'halloween-games',
    type: 'Guide & Tips',
    title: '15 Free Halloween Party Games for Kids & Adults',
    description: 'Get 15 no-prep games for your next party, plus free printable Halloween bingo cards to make your event a smash hit!',
    thumbnailUrl: '/posts/Halloween_Bingo_Image.png',
    linkUrl: '/posts/halloween-party-games.html',
  },
  {
    id: 'how-to-organize',
    type: 'Guide & Tips',
    title: 'How to Organize a Secret Santa: A Complete Guide',
    description: "Your stress-free roadmap to planning the perfect gift exchange. Learn the 6 simple steps, common mistakes to avoid, and how to use free tools to make it easy.",
    thumbnailUrl: '/posts/secret_santa_questionnaire_thumbnail.png',
    linkUrl: '/how-to-organize-secret-santa.html',
  },
  {
   id: 'bingo-guide',
    type: 'Guide & Tips',
    title: 'How to Make Your Secret Santa Party Actually Fun',
    description: 'Transform boring parties with Secret Santa Bingo! This guide includes free printable cards and game variations to keep everyone engaged and laughing.',
    thumbnailUrl: '/posts/Free_Secret_Santa_Bingo_Card_Guide.png',
    linkUrl: '/secret-santa-bingo-guide.html',
  },
];
