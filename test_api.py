import requests
import json
import base64

# Dummy image
dummy_img = base64.b64encode(b"dummy_data").decode("utf-8")

headers = {
    "Content-Type": "application/json"
}

# The route is likely authenticated, but let's see if we can trigger the 500
# Wait, we need an auth token or bypass it.
# Let's write a script to import the FastAPI app and TestClient
from fastapi.testclient import TestClient
from api.index import app
from api.database import get_db, Base, engine
from api.models import User

client = TestClient(app)

# We need a user.
# Let's bypass auth by overriding dependency
from api.index import get_current_user

def override_get_current_user():
    user = User(email="test@test.com")
    user.id = "123"
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

res = client.post("/api/outfits/generate-tryon", json={
    "person_image_base64": f"data:image/png;base64,{dummy_img}",
    "garment_image_base64": f"data:image/png;base64,{dummy_img}",
    "garment_description": "upper_body"
})

print(res.status_code)
print(res.json())

