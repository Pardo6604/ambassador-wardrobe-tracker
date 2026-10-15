import sqlite3
import requests

db = sqlite3.connect('closet_pr.db')
c = db.cursor()
c.execute("SELECT id, email, avatar_url FROM users")
for row in c.fetchall():
    print(row)

# Let's try to get profile using python requests. We need the jwt token.
# Let's just create a test user or see what the login returns.
res = requests.post('http://127.0.0.1:8000/api/user/login', json={'email': 'pardo@gmail.com', 'password': 'password123'})
print("Login:", res.json())
if 'access_token' in res.json():
    token = res.json()['access_token']
    res = requests.get('http://127.0.0.1:8000/api/user/profile', headers={'Authorization': f'Bearer {token}'})
    print("Profile:", res.json())

