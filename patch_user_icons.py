import sqlite3

conn = sqlite3.connect('closet_pr.db')
c = conn.cursor()

c.execute("PRAGMA table_info(users)")
cols = [col[1] for col in c.fetchall()]
if 'status_icons_json' not in cols:
    print("Adding status_icons_json to users")
    c.execute("ALTER TABLE users ADD COLUMN status_icons_json VARCHAR(1024) DEFAULT '{}'")

conn.commit()
conn.close()
