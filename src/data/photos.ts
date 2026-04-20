export interface Photo {
  id: number;
  title: string;
  category: string;
  src: string;
  likes: number;
  views: number;
  author: string;
  date: string;
  liked: boolean;
  _apiId?: number;
}

export const PHOTOS: Photo[] = [];

export const CATEGORIES = ["Все", "Пейзаж", "Природа", "Урбан", "Портрет", "Путешествия"];