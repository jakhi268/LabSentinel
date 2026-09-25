import time
import requests

SERVER_URL = "https://labsentinel-dashboard.onrender.com"
PC_ID = "PC-03"
AGENT_ID = "AGENT-PC-03"

while True:
    try:
        response = requests.post(
            f"{SERVER_URL}/api/agent/heartbeat",
            json={
                "pc": PC_ID,
                "agent": AGENT_ID
            },
            timeout=10
        )

        print(response.json())

    except Exception as e:
        print("Connection error:", e)

    time.sleep(10)