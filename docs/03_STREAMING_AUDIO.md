# AssemblyAI - Streaming Audio Transcription

Source: https://www.assemblyai.com/docs

---

## Table of Contents
1. [Real-Time Transcription](#real-time-transcription)
2. [WebSocket Connection](#websocket-connection)
3. [Universal-3 Pro Streaming](#universal-3-pro-streaming)
4. [Universal Streaming](#universal-streaming)
5. [Turn Detection](#turn-detection)
6. [Streaming Webhooks](#streaming-webhooks)

---

## Real-Time Transcription

The Streaming Speech-to-Text API uses WebSockets for real-time audio transcription.

### Base URL

```
wss://streaming.assemblyai.com
```

For EU:
```
wss://streaming.eu.assemblyai.com
```

---

## WebSocket Connection

### Python Example

```python
import websocket
import json
import audio

# Create WebSocket connection
ws_url = "wss://streaming.assemblyai.com/v2/ws"
ws = websocket.create_connection(
    ws_url + "?sample_rate=16000&auth_token=YOUR_API_KEY"
)

# Send audio chunks
def send_audio():
    for chunk in audio_stream:
        ws.send(chunk, opcode=2)  # Binary frame
    
    ws.close()

# Receive transcriptions
def on_message(ws, message):
    data = json.loads(message)
    
    if data.get("message_type") == "FinalTranscript":
        print(f"Final: {data['text']}")
    elif data.get("message_type") == "PartialTranscript":
        print(f"Partial: {data['text']}")

ws.on_message = on_message
```

### JavaScript Example

```javascript
const WebSocket = require('ws');

const ws = new WebSocket(
  'wss://streaming.assemblyai.com/v2/ws?sample_rate=16000',
  [],
  { headers: { 'Authorization': 'YOUR_API_KEY' } }
);

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.message_type === 'FinalTranscript') {
    console.log('Final:', message.text);
  } else if (message.message_type === 'PartialTranscript') {
    console.log('Partial:', message.text);
  }
});
```

---

## Universal-3 Pro Streaming

The latest model for streaming transcription with superior accuracy.

### Features

- Real-time transcription with Universal-3 Pro
- Partial transcripts for immediate feedback
- Turn detection for natural conversation flow
- Multi-language support

### Configuration

```python
# Connection config
config = {
    "sample_rate": 16000,
    "encoding": "pcm_s16le",
    "speech_model": "universal-3-pro"
}
```

### Message Types

| Type | Description |
|------|-------------|
| `PartialTranscript` | Interim result while speaking |
| `FinalTranscript` | Confirmed final result |

### Partial Transcript

```json
{
    "message_type": "PartialTranscript",
    "text": "Hello, how can I",
    "confidence": 0.92,
    "words": [
        {"text": "Hello", "confidence": 0.95},
        {"text": "how", "confidence": 0.91},
        {"text": "can", "confidence": 0.89},
        {"text": "I", "confidence": 0.87}
    ]
}
```

### Final Transcript

```json
{
    "message_type": "FinalTranscript",
    "text": "Hello, how can I help you today?",
    "confidence": 0.98,
    "words": [...],
    "spk_count": 1
}
```

---

## Universal Streaming

The original streaming model with low latency.

### Features

- Ultra-low latency transcription
- Turn detection
- Multilingual streaming

### Audio Requirements

| Parameter | Value |
|-----------|-------|
| Sample Rate | 16000 Hz (recommended) or 8000 Hz |
| Encoding | PCM 16-bit |
| Channels | Mono |

---

## Turn Detection

Intelligent turn detection for natural conversation flow.

### Enable Turn Detection

```python
config = {
    "turn_threshold": 0.5,  # 0-1, higher = more sensitive
    "turn_count": 1
}
```

### How It Works

- Detects when a speaker finishes a turn
- Emits final transcript when turn is detected
- Automatically handles overlapping speech

### Configuration Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `turn_threshold` | float | Threshold for turn detection (0-1) |
| `turn_count` | integer | Number of turns to detect |
| `enable_td` | boolean | Enable/disable turn detection |

---

## Streaming Webhooks

Get notified when streaming session ends.

### Configure Webhook

```python
config = {
    "webhook_url": "https://your-server.com/webhook",
    "webhook_auth_header": "X-Custom-Auth"
}
```

### Webhook Payload

```json
{
    "session_id": "session_123",
    "status": "completed",
    "transcript_ids": ["transcript_1", "transcript_2"]
}
```

---

## Best Practices

### Audio Quality

1. Use 16kHz sample rate for best accuracy
2. Use mono channel
3. Minimize background noise
4. Ensure good microphone quality

### Latency Optimization

1. Send audio in small chunks (100-500ms)
2. Use buffering to smooth out network issues
3. Enable partial transcripts for real-time feedback

### Error Handling

```python
importwebsocket

def on_error(ws, error):
    print(f"Error: {error}")
    
def on_close(ws, close_status_code, close_msg):
    print(f"Closed: {close_status_code} - {close_msg}")
```

---

## Supported Languages

Streaming supports the following languages:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)
- And more...

### Multilingual Streaming

```python
config = {
    "language_detection": True  # Auto-detect language
}
```

---

*For more details, visit https://www.assemblyai.com/docs*
