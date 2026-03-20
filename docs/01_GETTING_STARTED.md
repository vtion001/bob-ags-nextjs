# AssemblyAI Documentation - Getting Started & API Overview

Source: https://www.assemblyai.com/docs

---

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Transcribe Pre-Recorded Audio](#transcribe-pre-recorded-audio)
4. [Transcribe Streaming Audio](#transcribe-streaming-audio)
5. [Models](#models)

---

## API Overview

### Base URLs

**Pre-recorded STT:**
```
https://api.assemblyai.com
```

**Streaming STT:**
```
wss://streaming.assemblyai.com
```

**LLM Gateway:**
```
https://llm-gateway.assemblyai.com
```

> **Note:** For EU data residency, replace `api.assemblyai.com` with `api.eu.assemblyai.com`

---

## Authentication

To make authorized calls to the REST API, your app must provide an authorization header with an API key.

```bash
# Authenticated request
curl https://api.assemblyai.com/v2/transcript \
  --header 'Authorization: <YOUR_API_KEY>'
```

You can find your API key in the [AssemblyAI dashboard](https://www.assemblyai.com/app/api-keys).

---

## HTTP Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request was successful |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500, 503, 504 | Server Error | Something went wrong on AssemblyAI's end |

---

## Transcribe Pre-Recorded Audio

### Step 1: Submit Transcription Request

```python
import requests

base_url = "https://api.assemblyai.com"
headers = {"authorization": "YOUR_API_KEY"}

# Option A: Use a publicly accessible URL
audio_file = "https://assembly.ai/wildfires.mp3"

# Option B: Upload a local file
with open("./example.mp3", "rb") as f:
    response = requests.post(base_url + "/v2/upload", headers=headers, data=f)
    audio_file = response.json()["upload_url"]

# Submit transcription
data = {
    "audio_url": audio_file,
    "speech_models": ["universal-3-pro", "universal-2"],
    "language_detection": True,
    "speaker_labels": True
}

response = requests.post(base_url + "/v2/transcript", headers=headers, json=data)
transcript_id = response.json()["id"]
```

### Step 2: Poll for Results

```python
import time

polling_endpoint = f"{base_url}/v2/transcript/{transcript_id}"

while True:
    transcript = requests.get(polling_endpoint, headers=headers).json()
    
    if transcript["status"] == "completed":
        print(f"Transcript: {transcript['text']}")
        break
    elif transcript["status"] == "error":
        raise RuntimeError(f"Transcription failed: {transcript['error']}")
    else:
        time.sleep(3)
```

---

## Transcribe Streaming Audio

### WebSocket Connection

```python
import websocket

ws_url = "wss://streaming.assemblyai.com/v2/ws"
ws = websocket.create_connection(ws_url + "?sample_rate=16000")

# Send audio data in chunks
# Receive transcriptions in real-time
```

See full streaming guide for more details.

---

## Models

### Available Speech Models

| Model | Description |
|-------|-------------|
| `universal-3-pro` | Latest and most accurate model |
| `universal-2` | Fast and accurate |
| `universal` | Legacy model |

### Features

- **Speaker Diarization**: Add speaker labels to transcript
- **Language Detection**: Auto-detect spoken language
- **PII Redaction**: Remove personally identifiable information
- **Sentiment Analysis**: Detect speaker sentiment
- **Topic Detection**: Identify topics discussed

---

## Error Handling

### Failed Transcription Response

```json
{
    "status": "error",
    "error": "Download error to https://foo.bar, 403 Client Error: Forbidden"
}
```

### Common Errors

- Audio data is corrupted or unsupported
- Audio URL is a webpage rather than a file
- Audio URL isn't accessible from AssemblyAI's servers
- Audio duration is too short (less than 160ms)

---

*For more details, visit https://www.assemblyai.com/docs*
