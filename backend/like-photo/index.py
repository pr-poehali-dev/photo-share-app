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
    """Ставит или убирает лайк для фото (по session_id)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    photo_id = body.get("photo_id")
    session_id = body.get("session_id", "")

    if not photo_id or not session_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "photo_id и session_id обязательны"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.photo_likes WHERE photo_id = %s AND session_id = %s",
        (photo_id, session_id),
    )
    already_liked = cur.fetchone() is not None

    if already_liked:
        cur.execute(
            f"DELETE FROM {SCHEMA}.photo_likes WHERE photo_id = %s AND session_id = %s",
            (photo_id, session_id),
        )
        cur.execute(
            f"UPDATE {SCHEMA}.photos SET likes = GREATEST(0, likes - 1) WHERE id = %s RETURNING likes",
            (photo_id,),
        )
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.photo_likes (photo_id, session_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (photo_id, session_id),
        )
        cur.execute(
            f"UPDATE {SCHEMA}.photos SET likes = likes + 1 WHERE id = %s RETURNING likes",
            (photo_id,),
        )

    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"liked": not already_liked, "likes": row[0] if row else 0}),
    }
