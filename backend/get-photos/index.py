import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p7344896_photo_share_app")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Возвращает список всех фото из БД, отсортированных по дате."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT id, title, author, category, image_url, likes, views, created_at
        FROM {SCHEMA}.photos
        ORDER BY created_at DESC
        LIMIT 100
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    photos = [
        {
            "id": r[0],
            "title": r[1],
            "author": r[2],
            "category": r[3],
            "image_url": r[4],
            "likes": r[5],
            "views": r[6],
            "created_at": r[7].isoformat(),
        }
        for r in rows
    ]

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"photos": photos}),
    }