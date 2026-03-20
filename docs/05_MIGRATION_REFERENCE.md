# AssemblyAI - Migration Guides & Reference

Source: https://www.assemblyai.com/docs

---

## Table of Contents
1. [Migration from Deepgram](#migration-from-deepgram)
2. [Migration from OpenAI Whisper](#migration-from-openai-whisper)
3. [Migration from AWS Transcribe](#migration-from-aws-transcribe)
4. [Account Management](#account-management)
5. [Data Retention](#data-retention)
6. [Rate Limits](#rate-limits)
7. [API Reference](#api-reference)

---

## Migration from Deepgram

### Key Differences

| Deepgram | AssemblyAI |
|----------|------------|
| `results.channels[0].alternatives[0].transcript` | `text` |
| Endpoint-based | WebSocket + REST |
| Custom intents | Built-in (with LLM Gateway) |

### Code Comparison

**Deepgram:**
```python
import deepgram

dg_client = deepgram.Deepgram("API_KEY")
response = await dg_client.transcription.prerecorded(
    {"url": "audio.mp3"},
    {"punctuate": True}
)
transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
```

**AssemblyAI:**
```python
from assemblyai import AssemblyAI

client = AssemblyAI(api_key="API_KEY")
transcript = client.transcribe("audio.mp3")
print(transcript.text)
```

### Migration Steps

1. Get AssemblyAI API key
2. Replace SDK/dependencies
3. Update authentication
4. Map response fields
5. Test with existing audio

---

## Migration from OpenAI Whisper

### Key Differences

| Whisper | AssemblyAI |
|---------|------------|
| Local model | Cloud API |
| No speaker diarization | Built-in speaker labels |
| Manual language setting | Auto language detection |
| No streaming | Real-time streaming |

### Code Comparison

**Whisper (local):**
```python
import whisper

model = whisper.load_model("base")
result = model.transcribe("audio.mp3")
print(result["text"])
```

**AssemblyAI:**
```python
from assemblyai import AssemblyAI

client = AssemblyAI(api_key="API_KEY")
transcript = client.transcribe(
    audio_url="audio.mp3",
    language_detection=True,
    speaker_labels=True
)
print(transcript.text)
```

### Advantages of AssemblyAI

- ✅ Real-time transcription
- ✅ Speaker diarization
- ✅ PII redaction
- ✅ Sentiment analysis
- ✅ Auto language detection
- ✅ Webhooks for async

---

## Migration from AWS Transcribe

### Key Differences

| AWS Transcribe | AssemblyAI |
|----------------|------------|
| AWS credentials | Simple API key |
| Job-based | Real-time + async |
| Limited languages | 100+ languages |
| Complex pricing | Simple pricing |

### Code Comparison

**AWS Transcribe:**
```python
import boto3

transcribe = boto3.client('transcribe')
transcribe.start_transcription_job(
    TranscriptionJobName='job1',
    Media={'MediaFileUri': 's3://bucket/audio.mp3'},
    MediaFormat='mp3',
    LanguageCode='en-US'
)
```

**AssemblyAI:**
```python
from assemblyai import AssemblyAI

client = AssemblyAI(api_key="API_KEY")
transcript = client.transcribe("audio.mp3")
```

---

## Account Management

### Get API Key

1. Go to [AssemblyAI Dashboard](https://www.assemblyai.com/app/api-keys)
2. Click "Create API Key"
3. Copy and store securely

### View Usage

```python
# Get account details
client = AssemblyAI(api_key="API_KEY")
account = client.account.get()
print(f"Usage: {account.usage}")
```

### Billing

- View billing at: https://www.assemblyai.com/dashboard/account/billing
- Set up payment methods
- Download invoices

---

## Data Retention

### Default Retention

- Audio files: Processed then deleted
- Transcripts: Stored per user preference

### Configure Retention

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "auto_chapters": True,
    "entity_detection": True
}
```

### Data Security

- Encryption at rest (AES-256)
- TLS in transit
- SOC 2 Type II certified
- GDPR compliant

### Model Training

- AssemblyAI does not use customer audio for model training without explicit consent
- Review privacy policy for details

---

## Rate Limits

### Pre-Recorded API

| Plan | Requests/minute |
|------|-----------------|
| Free | 10 |
| Pay-as-you-go | 100 |
| Enterprise | Custom |

### Streaming API

| Plan | Concurrent Streams |
|------|-------------------|
| Free | 1 |
| Pay-as-you-go | 10 |
| Enterprise | Custom |

### Rate Limit Headers

When rate limited, check response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 60
```

### Handle Rate Limits

```python
import time
from requests.exceptions import HTTPError

for i in range(max_retries):
    try:
        response = client.transcribe(audio_url)
    except HTTPError as e:
        if e.response.status_code == 429:
            wait_time = int(e.response.headers.get("X-RateLimit-Reset", 60))
            time.sleep(wait_time)
        else:
            raise
```

---

## API Reference

### Base URLs

| Service | URL |
|---------|-----|
| Pre-recorded STT | `https://api.assemblyai.com` |
| Streaming STT | `wss://streaming.assemblyai.com` |
| LLM Gateway | `https://llm-gateway.assemblyai.com` |
| EU (Pre-recorded) | `https://api.eu.assemblyai.com` |
| EU (Streaming) | `wss://streaming.eu.assemblyai.com` |

### Endpoints

#### Transcription

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v2/transcript | Start transcription |
| GET | /v2/transcript/{id} | Get transcript |
| GET | /v2/transcript/{id}/words | Get words with timestamps |
| GET | /v2/transcript/{id}/subtitles | Get subtitles (SRT/VTT) |
| DELETE | /v2/transcript/{id} | Delete transcript |
| GET | /v2/transcripts | List all transcripts |

#### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v2/upload | Upload audio file |

#### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v2/webhook | Create webhook |
| GET | /v2/webhook | List webhooks |
| DELETE | /v2/webhook/{id} | Delete webhook |

### SDK Installation

```bash
# Python
pip install assemblyai

# Node.js
npm install assemblyai

# Go
go get github.com/AssemblyAI/assemblyai-go

# Ruby
gem install assemblyai
```

### Python SDK Example

```python
from assemblyai import AssemblyAI

client = AssemblyAI(api_key="YOUR_API_KEY")

# Transcribe
transcript = client.transcribe(
    audio_url="https://example.com/audio.mp3",
    speaker_labels=True,
    language_detection=True
)

print(transcript.text)
```

### JavaScript SDK Example

```javascript
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({ apiKey: 'YOUR_API_KEY' });

const transcript = await client.transcripts.transcribe({
  audio: 'https://example.com/audio.mp3',
  speakerLabels: true,
  languageDetection: true
});

console.log(transcript.text);
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSEMBLYAI QUICK REFERENCE              │
├─────────────────────────────────────────────────────────────┤
│ Base URL:          https://api.assemblyai.com             │
│ Auth Header:       Authorization: <YOUR_API_KEY>           │
│                                                                 │
│ ENDPOINTS:                                               │
│   POST /v2/transcript    - Start transcription             │
│   GET  /v2/transcript/:id - Get result                   │
│   GET  /v2/upload        - Upload audio                   │
│                                                                 │
│ STREAMING:                                               │
│   WSS streaming.assemblyai.com/v2/ws                      │
│                                                                 │
│ MODELS:                                                  │
│   universal-3-pro   - Latest, most accurate               │
│   universal-2      - Fast, accurate                       │
│                                                                 │
│ FEATURES:                                                │
│   speaker_labels, language_detection,                     │
│   auto_chapters, pii_redaction, sentiment_analysis        │
└─────────────────────────────────────────────────────────────┘
```

---

*For complete documentation, visit https://www.assemblyai.com/docs*
