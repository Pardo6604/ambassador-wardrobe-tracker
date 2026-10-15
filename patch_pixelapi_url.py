import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Replace generate_tryon polling logic
old_generate = """            if status == "completed":
                output_b64 = poll_data.get("result_image_b64")
                return {"result_image_base64": f"data:image/png;base64,{output_b64}"}"""

new_generate = """            if status == "completed":
                output_b64 = poll_data.get("result_image_b64")
                if not output_b64 and poll_data.get("output_url"):
                    import base64
                    img_data = requests.get(poll_data.get("output_url")).content
                    output_b64 = base64.b64encode(img_data).decode("utf-8")
                return {"result_image_base64": f"data:image/png;base64,{output_b64}"}"""

content = content.replace(old_generate, new_generate)

# Replace auto_suggest_outfit polling logic
old_auto = """                if status == "completed":
                    output_b64 = poll_data.get("result_image_b64")
                    current_person_b64 = f"data:image/png;base64,{output_b64}"
                    break"""

new_auto = """                if status == "completed":
                    output_b64 = poll_data.get("result_image_b64")
                    if not output_b64 and poll_data.get("output_url"):
                        import base64
                        img_data = requests.get(poll_data.get("output_url")).content
                        output_b64 = base64.b64encode(img_data).decode("utf-8")
                    current_person_b64 = f"data:image/png;base64,{output_b64}"
                    break"""

content = content.replace(old_auto, new_auto)

with open('api/index.py', 'w') as f:
    f.write(content)
