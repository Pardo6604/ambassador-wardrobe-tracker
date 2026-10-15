import sqlite3

conn = sqlite3.connect('closet_pr.db')
c = conn.cursor()

c.execute("PRAGMA table_info(outfits)")
cols = [col[1] for col in c.fetchall()]
if 'is_custom_fit_pic' not in cols:
    print("Adding is_custom_fit_pic to outfits")
    c.execute("ALTER TABLE outfits ADD COLUMN is_custom_fit_pic BOOLEAN DEFAULT 0")

conn.commit()
conn.close()
