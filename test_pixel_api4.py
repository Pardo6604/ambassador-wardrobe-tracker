import requests
import base64
import time

pixel_api_key = "pk_live_1171b5b1483b1db26cb9d57c2656b2c13203dc7754f2bcd0"
headers = {
    "Authorization": f"Bearer {pixel_api_key}",
    "Content-Type": "application/json"
}

# The job ID from task 1188 was 4790bcd1-f484-439d-a02f-4776b19e12dd
poll_res = requests.get("https://api.pixelapi.dev/v1/virtual-tryon/jobs/4790bcd1-f484-439d-a02f-4776b19e12dd", headers=headers)
print("POLL DATA:", poll_res.json())
