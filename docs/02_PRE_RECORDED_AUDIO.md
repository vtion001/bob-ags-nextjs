# AssemblyAI - Pre-Recorded Audio Transcription

Source: https://www.assemblyai.com/docs

---

## Table of Contents
1. [Model Selection](#model-selection)
2. [Speaker Diarization](#speaker-diarization)
3. [Language Detection](#language-detection)
4. [Supported Languages](#supported-languages)
5. [Universal-3 Pro](#universal-3-pro)
6. [Additional Features](#additional-features)

---

## Model Selection

Choose the right speech model for your audio:

| Model | Best For | Languages |
|-------|----------|-----------|
| universal-3-pro | Highest accuracy | 100+ |
| universal-2 | Fast, accurate | 100+ |

### Example Request

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "speech_model": "universal-3-pro"
}
```

---

## Speaker Diarization

Add speaker labels to identify different speakers in the audio.

### Enable Speaker Diarization

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "speaker_labels": True
}
```

### Response with Speakers

```json
{
    "words": [
        {
            "text": "Hello",
            "speaker": "A",
            "confidence": 0.95,
            "start": 1000,
            "end": 1500
        }
    ]
}
```

### Speaker Diarization Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `speaker_labels` | boolean | Enable speaker diarization |
| `diarization_version` | string | Version of diarization model |
| `max_speakers` | integer | Max speakers to identify |
| `min_speakers` | integer | Min speakers to identify |

---

## Language Detection

Automatically detect the dominant language in your audio.

### Enable Auto Language Detection

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "language_detection": True
}
```

### Supported Languages

The API automatically detects 100+ languages including:
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
- And many more...

### Manual Language Setting

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "language_code": "en"
}
```

---

## Universal-3 Pro

The latest and most advanced speech recognition model from AssemblyAI.

### Features

- Higher accuracy across all languages
- Better handling of accented speech
- Improved noise handling
- Industry-leading word confidence scores

### Configuration

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "speech_models": ["universal-3-pro"],
    "prompt": "Custom context for better transcription"
}
```

### Prompting

You can provide context to improve transcription accuracy:

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "speech_model": "universal-3-pro",
    "prompt": "This is a conversation about medical terminology"
}
```

---

## Additional Features

### Multichannel Transcription

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "multichannel": True,
    "channel_labels": {
        "0": "Agent",
        "1": "Customer"
    }
}
```

### Custom Spelling

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "custom_spelling": {
        "API": "Application Programming Interface",
        "AI": "Artificial Intelligence"
    }
}
```

### Filler Words

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "filter_profanity": True,
    "remove_disfluencies": True
}
```

### Word Search

```python
# Search for specific words in transcript
GET /v2/transcript/{id}/words
```

### Transcript Export Options

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "export_text": True,
    "export_subtitles": True,
    "subtitles_format": "srt"  # or "vtt"
}
```

### Delete Transcripts

```python
# Delete a transcript
DELETE /v2/transcript/{id}
```

---

## Webhooks

Get notified when transcription is complete.

### Configure Webhook

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "webhook_url": "https://your-server.com/webhook",
    "webhook_auth_header": "X-Custom-Header"
}
```

### Webhook Payload

```json
{
    "transcript_id": "abc123",
    "status": "completed",
    "text": "Transcribed content..."
}
```

---

## Region & Data Residency

### Available Regions

| Region | Endpoint |
|--------|----------|
| US (default) | api.assemblyai.com |
| EU | api.eu.assemblyai.com |

### Configure Region

```python
# For EU endpoint
base_url = "https://api.eu.assemblyai.com"
```

---

*For more details, visit https://www.assemblyai.com/docs*
