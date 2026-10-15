import requests
import base64
import time

url = "http://127.0.0.1:8000"

# Register
res = requests.post(f"{url}/api/user/register", json={"email": "vton@test.com", "password": "password", "name": "VTON Test"})
# Login
res = requests.post(f"{url}/api/user/login", json={"email": "vton@test.com", "password": "password"})
token = res.json()["access_token"]

# Dummy image
img_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\n\x00\x00\x00\n\x08\x02\x00\x00\x00\x02PX\xea\x00\x00\x00\x16IDATx\x9cc\xfc\xff\xff?\x03\t\x04\x02\x08\x00\x00\x00\x1f\x00\x01\x14\x9c\xd5\x93\x00\x00\x00\x00IEND\xaeB`\x82'
b64 = base64.b64encode(img_data).decode('utf-8')

payload = {
    "person_image_base64": f"data:image/png;base64,{b64}",
    "garment_image_base64": f"data:image/png;base64,{b64}",
    "garment_description": "test"
}

headers = {"Authorization": f"Bearer {token}"}

print("Sending VTON request...")
res = requests.post(f"{url}/api/outfits/generate-tryon", json=payload, headers=headers)
print(res.status_code)
print(res.text)

