import sqlite3
import uuid

conn = sqlite3.connect('closet_pr.db')
c = conn.cursor()

# Create campaign_boards
c.execute("""
CREATE TABLE IF NOT EXISTS campaign_boards (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    columns_json VARCHAR(8192) NOT NULL DEFAULT '[]',
    created_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
)
""")

# Check if tasks table needs board_id
c.execute("PRAGMA table_info(campaign_tasks)")
cols = [col[1] for col in c.fetchall()]
if 'board_id' not in cols:
    # Need to migrate
    print("Migrating campaign_tasks to add board_id...")
    # First, for every user, create a Main Board using their board_columns_json
    c.execute("SELECT id, board_columns_json FROM users")
    users = c.fetchall()
    
    # Track the new main board for each user
    user_boards = {}
    
    for u in users:
        uid = u[0]
        cols_json = u[1] if u[1] else '[]'
        board_id = str(uuid.uuid4())
        user_boards[uid] = board_id
        c.execute(
            "INSERT INTO campaign_boards (id, user_id, title, columns_json, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            (board_id, uid, "Main Board", cols_json)
        )
        
    # Recreate campaign_tasks with board_id
    c.execute("""
    CREATE TABLE campaign_tasks_new (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        board_id CHAR(36) NOT NULL,
        title VARCHAR(150) NOT NULL,
        cells_json VARCHAR(8192) NOT NULL DEFAULT '{}',
        created_at DATETIME NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(board_id) REFERENCES campaign_boards(id) ON DELETE CASCADE
    )
    """)
    
    # Copy data
    c.execute("SELECT id, user_id, title, cells_json, created_at FROM campaign_tasks")
    tasks = c.fetchall()
    for t in tasks:
        uid = t[1]
        board_id = user_boards.get(uid)
        if board_id:
            c.execute(
                "INSERT INTO campaign_tasks_new (id, user_id, board_id, title, cells_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (t[0], t[1], board_id, t[2], t[3], t[4])
            )
            
    c.execute("DROP TABLE campaign_tasks")
    c.execute("ALTER TABLE campaign_tasks_new RENAME TO campaign_tasks")
    print("Migrated successfully.")
else:
    print("Already migrated.")

conn.commit()
conn.close()
