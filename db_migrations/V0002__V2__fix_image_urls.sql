UPDATE t_p7344896_photo_share_app.photos
SET image_url = REPLACE(image_url, '/files/photos/', '/bucket/photos/')
WHERE image_url LIKE '%/files/photos/%';
