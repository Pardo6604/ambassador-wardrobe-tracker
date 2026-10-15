from fastapi.testclient import TestClient
from api.index import app
from api.models import User
from api.index import get_current_user
import base64
import requests

def override_get_current_user():
    user = User(email="test@test.com")
    user.id = "123"
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

person_data = requests.get("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400").content
garment_data = requests.get("https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400").content

person_b64 = base64.b64encode(person_data).decode("utf-8")
garment_b64 = base64.b64encode(garment_data).decode("utf-8")

res = client.post("/api/outfits/generate-tryon", json={
    "person_image_base64": f"data:image/png;base64,{person_b64}",
    "garment_image_base64": f"data:image/png;base64,{garment_b64}",
    "garment_description": "upper_body"
})

print(res.status_code)
if res.status_code == 200:
    data = res.json()
    b64_out = data.get("result_image_base64")
    print("SUCCESS", b64_out[:100])
else:
    print(res.json())
