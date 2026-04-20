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

export const PHOTOS: Photo[] = [
  {
    id: 1,
    title: "Закат над горами",
    category: "Пейзаж",
    src: "https://cdn.poehali.dev/projects/a754af00-323f-4ac2-972b-bb1f1db10443/files/68cbf817-681d-46ce-ac38-8b7b5534bda0.jpg",
    likes: 247,
    views: 1842,
    author: "Алексей К.",
    date: "18 апр 2026",
    liked: false,
  },
  {
    id: 2,
    title: "Тропический рай",
    category: "Природа",
    src: "https://cdn.poehali.dev/projects/a754af00-323f-4ac2-972b-bb1f1db10443/files/c2eb025e-2507-4472-889e-810add6e6d54.jpg",
    likes: 189,
    views: 1203,
    author: "Мария В.",
    date: "17 апр 2026",
    liked: false,
  },
  {
    id: 3,
    title: "Ночной город",
    category: "Урбан",
    src: "https://cdn.poehali.dev/projects/a754af00-323f-4ac2-972b-bb1f1db10443/files/d0f7a2e8-4bef-4106-a905-9e9b45bf0398.jpg",
    likes: 312,
    views: 2587,
    author: "Дмитрий Н.",
    date: "16 апр 2026",
    liked: false,
  },
  {
    id: 4,
    title: "Свет сквозь листья",
    category: "Портрет",
    src: "https://cdn.poehali.dev/projects/a754af00-323f-4ac2-972b-bb1f1db10443/files/063fef8a-fd94-4155-a888-ed890c132a99.jpg",
    likes: 421,
    views: 3104,
    author: "Анна С.",
    date: "15 апр 2026",
    liked: false,
  },
  {
    id: 5,
    title: "Храм джунглей",
    category: "Путешествия",
    src: "https://cdn.poehali.dev/projects/a754af00-323f-4ac2-972b-bb1f1db10443/files/a036a4ee-bcab-4a69-a09d-e10d50e15e22.jpg",
    likes: 156,
    views: 978,
    author: "Игорь Б.",
    date: "14 апр 2026",
    liked: false,
  },
  {
    id: 6,
    title: "Водопад в ущелье",
    category: "Природа",
    src: "https://cdn.poehali.dev/projects/a754af00-323f-4ac2-972b-bb1f1db10443/files/831dae3e-b7ce-4d0f-af6f-95e84568dabb.jpg",
    likes: 278,
    views: 1654,
    author: "Елена Р.",
    date: "13 апр 2026",
    liked: false,
  },
];

export const CATEGORIES = ["Все", "Пейзаж", "Природа", "Урбан", "Портрет", "Путешествия"];