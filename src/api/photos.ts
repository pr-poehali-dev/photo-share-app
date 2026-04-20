const URLS = {
  getPhotos: "https://functions.poehali.dev/0f5a76cc-ea2f-41b6-9008-fc6cb14cd336",
  uploadPhoto: "https://functions.poehali.dev/f8b67671-e9e1-418a-aa4d-8b4d28dbe611",
  likePhoto: "https://functions.poehali.dev/6493e1fd-129d-4354-9c71-94151abe936e",
  viewPhoto: "https://functions.poehali.dev/dcfd0780-c791-490b-92f4-a5b82d9413df",
};

export interface ApiPhoto {
  id: number;
  title: string;
  author: string;
  category: string;
  image_url: string;
  likes: number;
  views: number;
  created_at: string;
}

export async function fetchPhotos(): Promise<ApiPhoto[]> {
  const res = await fetch(URLS.getPhotos);
  const data = JSON.parse(await res.json());
  return data.photos ?? [];
}

export async function uploadPhoto(payload: {
  title: string;
  author: string;
  category: string;
  image_b64: string;
  content_type: string;
}): Promise<ApiPhoto> {
  const res = await fetch(URLS.uploadPhoto, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = JSON.parse(await res.json());
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
  return data;
}

export async function toggleLike(photoId: number, sessionId: string): Promise<{ liked: boolean; likes: number }> {
  const res = await fetch(URLS.likePhoto, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo_id: photoId, session_id: sessionId }),
  });
  return JSON.parse(await res.json());
}

export async function incrementView(photoId: number): Promise<void> {
  await fetch(URLS.viewPhoto, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo_id: photoId }),
  });
}
