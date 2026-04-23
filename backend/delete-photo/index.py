import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p7344896_photo_share_app")
ADMIN_PASSWORD = "89132543946Mama"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
}


def handler(event: dict, context) -> dict:
    """Удаляет фото по ID — доступно только с правильным паролем админа."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    photo_id = body.get("photo_id")
    password = body.get("password") or (event.get("headers") or {}).get("X-Admin-Password") or (event.get("headers") or {}).get("x-admin-password")

    if password != ADMIN_PASSWORD:
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Неверный пароль"})}

    if not photo_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "photo_id обязателен"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.photo_likes WHERE photo_id = %s", (photo_id,))
    cur.execute(f"DELETE FROM {SCHEMA}.photos WHERE id = %s RETURNING id", (photo_id,))
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not deleted:
        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Фото не найдено"})}

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}
