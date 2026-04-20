CREATE TABLE t_p7344896_photo_share_app.photos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL DEFAULT 'Аноним',
    category VARCHAR(100) NOT NULL DEFAULT 'Другое',
    image_url TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE t_p7344896_photo_share_app.photo_likes (
    photo_id INTEGER NOT NULL REFERENCES t_p7344896_photo_share_app.photos(id),
    session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (photo_id, session_id)
);
