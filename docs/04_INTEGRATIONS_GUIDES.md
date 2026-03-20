# AssemblyAI - Integrations & Guides

Source: https://www.assemblyai.com/docs

---

## Table of Contents
1. [Integrations Overview](#integrations-overview)
2. [Twilio](#twilio)
3. [Zapier](#zapier)
4. [LangChain](#langchain)
5. [YouTube Transcription](#youtube-transcription)
6. [S3 Integration](#s3-integration)
7. [Batch Transcription](#batch-transcription)
8. [Subtitles](#subtitles)
9. [Translation](#translation)

---

## Integrations Overview

AssemblyAI integrates with 100+ platforms including:

- **Communication**: Twilio, Zoom, Telnyx
- **Automation**: Zapier, Make, n8n
- **AI/ML**: LangChain, Semantic Kernel, Haystack
- **Cloud**: AWS, Google Cloud, Azure
- **Productivity**: Notion, Slack, Discord

---

## Twilio

Transcribe Twilio Voice calls in real-time.

### Setup

```python
from twilio import twiml
from assemblyai import AssemblyAI

client = AssemblyAI(api_key="YOUR_API_KEY")

# Configure webhook for Twilio
@route("/transcribe", methods=["POST"])
def transcribe():
    # Get audio URL from Twilio
    audio_url = request.form.get("RecordingUrl")
    
    # Submit for transcription
    transcript = client.transcribe(audio_url)
    
    return str(twiml.Response())
```

### Twilio + Streaming

```python
# Real-time Twilio call transcription
config = {
    "twilio_auth_token": "YOUR_TWILIO_AUTH_TOKEN",
    "twilio_account_sid": "YOUR_ACCOUNT_SID"
}
```

---

## Zapier

Automate transcription workflows without coding.

### Zapier Setup

1. **Trigger**: New recording file (Google Drive, Dropbox, etc.)
2. **Action**: Transcribe with AssemblyAI
3. **Action**: Save to storage or send notification

### Example Zap

```
Trigger: New file in Google Drive
  ↓
Action: AssemblyAI - Transcribe Audio
  ↓
Action: Slack - Send Message
```

### Configuration

```json
{
  "audio_url": "{{trigger_url}}",
  "speaker_labels": true,
  "language_detection": true
}
```

---

## LangChain

Use AssemblyAI with LangChain for AI-powered workflows.

### Python Installation

```bash
pip install assemblyai langchain
```

### Basic Example

```python
from langchain.document_loaders import AssemblyAIAudioTranscriptLoader
from langchain.indexes import VectorstoreIndexCreator

# Load audio transcript
loader = AssemblyAIAudioTranscriptLoader(
    api_key="YOUR_API_KEY",
    audio_url="https://example.com/audio.mp3"
)

docs = loader.load()

# Create vector store
index = VectorstoreIndexCreator().from_loaders([loader])
```

### With LangChain LLM

```python
from langchain.chains import ConversationalRetrievalChain
from langchain.llms import OpenAI

# Create qa chain
qa = ConversationalRetrievalChain.from_llm(
    OpenAI(),
    index.vectorstore.as_retriever()
)

# Ask questions about the transcript
result = qa({"question": "What was discussed about pricing?", "chat_history": []})
```

---

## YouTube Transcription

Transcribe YouTube videos directly.

### Using yt-dlp

```bash
# Install yt-dlp
pip install yt-dlp

# Download and transcribe
python
import subprocess
from assemblyai import AssemblyAI

# Download audio
subprocess.run([
    "yt-dlp",
    "-x",  # Extract audio
    "--audio-format", "mp3",
    "-o", "audio.mp3",
    "https://youtube.com/watch?v=EXAMPLE"
])

# Transcribe
client = AssemblyAI(api_key="YOUR_API_KEY")
transcript = client.transcribe("./audio.mp3")
print(transcript.text)
```

### Direct YouTube URL

```python
client = AssemblyAI(api_key="YOUR_API_KEY")

transcript = client.transcribe(
    audio_url="https://www.youtube.com/watch?v=EXAMPLE"
)
```

---

## S3 Integration

Transcribe audio files directly from AWS S3.

### Setup

```python
data = {
    "audio_url": "s3://your-bucket/audio.mp3",
    "aws_access_key_id": "YOUR_ACCESS_KEY",
    "aws_secret_access_key": "YOUR_SECRET_KEY"
}
```

### Using SDK

```python
import boto3
from assemblyai import AssemblyAI

# Create S3 client
s3 = boto3.client('s3')

# Generate presigned URL
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'bucket', 'Key': 'audio.mp3'},
    ExpiresIn=3600
)

# Transcribe
client = AssemblyAI(api_key="YOUR_API_KEY")
transcript = client.transcribe(audio_url=url)
```

---

## Batch Transcription

Transcribe multiple files at once.

### Submit Batch

```python
from assemblyai import AssemblyAI

client = AssemblyAI(api_key="YOUR_API_KEY")

# List of audio URLs
audio_files = [
    "https://example.com/audio1.mp3",
    "https://example.com/audio2.mp3",
    "https://example.com/audio3.mp3"
]

# Submit batch
batch = client.transcription.create_batched(
    audio_urls=audio_files,
    speaker_labels=True
)

print(f"Batch ID: {batch.id}")
print(f"Status: {batch.status}")
```

### Check Batch Status

```python
# Get all transcripts in batch
transcripts = client.transcription.list_transcripts(batch_id="batch_123")

for transcript in transcripts:
    print(f"{transcript.id}: {transcript.status}")
```

---

## Subtitles

Generate subtitles from transcripts.

### SRT Format

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "subtitles": True,
    "subtitles_format": "srt"
}

# Get SRT
response = requests.get(
    f"{base_url}/v2/transcript/{transcript_id}/subtitles",
    headers=headers
)
```

### VTT Format

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "subtitles": True,
    "subtitles_format": "vtt"
}
```

### With Speaker Labels

```python
data = {
    "audio_url": "https://example.com/audio.mp3",
    "subtitles": True,
    "subtitles_format": "srt",
    "speaker_labels": True
}
```

---

## Translation

Translate transcripts to other languages.

### Supported Languages

| Language | Code |
|----------|------|
| English | en |
| Spanish | es |
| French | fr |
| German | de |
| Portuguese | pt |
| Italian | it |
| Dutch | nl |
| Russian | ru |
| Chinese | zh |
| Japanese | ja |
| Korean | ko |

### Translate Transcript

```python
# After transcription is complete
translation = client.translation.translate(
    transcript_id="transcript_123",
    target_language="es"
)

print(translation.text)  # Spanish translation
```

### Multiple Languages

```python
languages = ["es", "fr", "de"]

for lang in languages:
    translation = client.translation.translate(
        transcript_id="transcript_123",
        target_language=lang
    )
    print(f"{lang}: {translation.text}")
```

---

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| 403 Forbidden | Check URL is publicly accessible |
| Unsupported format | Convert to MP3, WAV, or M4A |
| Audio too short | Ensure audio is > 160ms |
| Rate limit | Wait and retry with backoff |
| Webhook not received | Verify SSL certificate |

---

*For more details, visit https://www.assemblyai.com/docs*
