/**
 * What the city is posting about, gathered from public reels and posts. It fills
 * the app before people do, is always labelled with its source and never counts
 * as a review: verdicts only come from people with verified visits.
 */
export interface WebPick {
  id: string;
  title: string;
  placeId: string;
  /** Reels about it this week. */
  reels: number;
  /** Photo key in src/assets/photos. */
  photo: string;
  /** What most of those reels say, in one line. */
  gist: string;
}

export const WEB_PICKS: WebPick[] = [
  { id: 'w-manek', title: 'Late-night food at Manek Chowk', placeId: 'manek-chowk', reels: 31, photo: 'place-manek-chowk', gist: 'Most reels say go after 10 pm and start with the chocolate sandwich.' },
  { id: 'w-seoul', title: 'Kimchi pancake at Seoul Bowl', placeId: 'seoul-bowl', reels: 12, photo: 'dish-spicy-ramen', gist: 'Reels love the ramen; locals say the kimchi pancake is the real order.' },
  { id: 'w-clay', title: 'Wheel classes at Mitti Clay Studio', placeId: 'clay-studio', reels: 6, photo: 'place-clay-studio', gist: 'Beginner wheel sessions on weekends, aprons provided.' },
  { id: 'w-lake', title: 'Sunrise walks at Vastrapur Lake', placeId: 'vastrapur-lake', reels: 8, photo: 'place-vastrapur-lake', gist: 'Quiet before 7 am, yoga groups on the east lawn.' },
];
