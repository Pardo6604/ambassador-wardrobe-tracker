import os
import requests
import base64
import time

pixel_api_key = "pk_live_1171b5b1483b1db26cb9d57c2656b2c13203dc7754f2bcd0"
headers = {
    "Authorization": f"Bearer {pixel_api_key}",
    "Content-Type": "application/json"
}

# dummy base64 1x1 png
dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

payload = {
    "person_image": dummy_b64,
    "garment_image": dummy_b64,
    "category": "upperbody"
}

res = requests.post("https://api.pixelapi.dev/v1/virtual-tryon", json=payload, headers=headers)
print("POST STATUS:", res.status_code)
print("POST JSON:", res.json())

job_id = res.json().get("job_id")
if job_id:
    while True:
        poll_res = requests.get(f"https://api.pixelapi.dev/v1/virtual-tryon/jobs/{job_id}", headers=headers)
        poll_data = poll_res.json()
        print("POLL STATUS:", poll_data.get("status"))
        if poll_data.get("status") == "completed":
            b64 = poll_data.get("result_image_b64")
            print("Base64 start:", b64[:50])
            with open("test_result.png", "wb") as f:
                f.write(base64.b64decode(b64))
            print("Saved test_result.png")
            break
        elif poll_data.get("status") == "failed":
            print("Failed:", poll_data)
            break
        time.sleep(2)
