import json
import os
import uuid
import base64
import psycopg2
import boto3

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p7344896_photo_share_app")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Загружает фото в S3 и сохраняет запись в БД."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    title = (body.get("title") or "").strip()
    author = (body.get("author") or "").strip() or "НаТворче"
    image_b64 = body.get("image_b64", "")
    content_type = body.get("content_type", "image/jpeg")

    if not title or not image_b64:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title и image_b64 обязательны"})}

    image_data = base64.b64decode(image_b64)
    ext = "jpg"
    key = f"photos/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=image_data, ContentType=content_type)
    image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.photos (title, author, category, image_url) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
        (title, author, "Другое", image_url),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "id": row[0],
            "title": title,
            "image_url": image_url,
            "likes": 0,
            "views": 0,
            "created_at": row[1].isoformat(),
        }),
    }