import sqlite3

conn = sqlite3.connect('closet_pr.db')
c = conn.cursor()

c.execute('''
CREATE TABLE IF NOT EXISTS tryon_avatars (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    image_base64 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
)
''')

conn.commit()
conn.close()
