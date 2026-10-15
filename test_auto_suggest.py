import requests
import sqlite3

# Register a user
res = requests.post("http://localhost:5173/api/user/register", json={
    "email": "test_auto@example.com",
    "password": "password123",
    "name": "Test User"
})
print("Register:", res.text)

# Login
res = requests.post("http://localhost:5173/api/user/login", json={
    "email": "test_auto@example.com",
    "password": "password123"
})
print("Login:", res.text)
token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# Create item
res = requests.post("http://localhost:5173/api/items/upload", json={
    "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "category": "Tops",
    "brand": "TestBrand",
    "status": "Unworn"
}, headers=headers)
print("Create Item:", res.text)

# Set tryon image
res = requests.put("http://localhost:5173/api/user/tryon-image", json={
    "tryon_base_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
}, headers=headers)
print("Set Tryon:", res.status_code)

# Auto suggest
res = requests.post("http://localhost:5173/api/outfits/auto-suggest", headers=headers)
print("Auto Suggest:", res.status_code, res.text)
