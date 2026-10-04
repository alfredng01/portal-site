export interface Card {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardInput {
  title: string;
  description: string;
  url: string;
}
