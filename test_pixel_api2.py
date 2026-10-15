import requests
import base64
import time

pixel_api_key = "pk_live_1171b5b1483b1db26cb9d57c2656b2c13203dc7754f2bcd0"
headers = {
    "Authorization": f"Bearer {pixel_api_key}",
    "Content-Type": "application/json"
}

# download real images
person_data = requests.get("https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png").content
person_b64 = base64.b64encode(person_data).decode("utf-8")

payload = {
    "person_image": person_b64,
    "garment_image": person_b64,
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
            with open("test_result2.png", "wb") as f:
                f.write(base64.b64decode(b64))
            print("Saved test_result2.png")
            break
        elif poll_data.get("status") == "failed":
            print("Failed:", poll_data)
            break
        time.sleep(2)
