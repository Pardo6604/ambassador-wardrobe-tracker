import sqlite3

conn = sqlite3.connect('closet_pr.db')
c = conn.cursor()

c.execute("PRAGMA table_info(outfits)")
cols = [col[1] for col in c.fetchall()]
if 'status' not in cols:
    print("Adding status to outfits")
    c.execute("ALTER TABLE outfits ADD COLUMN status VARCHAR(100) DEFAULT 'Concepting'")

conn.commit()
conn.close()
