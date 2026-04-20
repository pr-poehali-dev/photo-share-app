import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p7344896_photo_share_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Увеличивает счётчик просмотров фото."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    photo_id = body.get("photo_id")

    if not photo_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "photo_id обязателен"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.photos SET views = views + 1 WHERE id = %s RETURNING views",
        (photo_id,),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"views": row[0] if row else 0}),
    }
