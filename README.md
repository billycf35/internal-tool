# internal-tool

Unified internal utility microservice — **URL checker** + **image conversion/compression**.  
Built with **Fastify + TypeScript + Sharp**. Designed for n8n automation workflows and Docker deployment.

## Features

- **URL Check** — single or bulk URL status, redirect detection, response time
- **Image Convert** — PNG/JPG → WEBP/JPG/PNG with optional resize
- **Image Compress** — configurable quality, effort, and lossless mode
- Request ID tracking
- Graceful shutdown
- Docker-ready with health checks

## Quick Start

### Local

```bash
cp .env.example .env
npm install
npm run dev
```

### Docker

```bash
cp .env.example .env
docker compose up -d
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `MAX_FILE_SIZE` | `10485760` | Max upload size in bytes (10MB) |
| `REQUEST_TIMEOUT` | `30000` | Request timeout in ms (30s) |
| `URL_CHECK_TIMEOUT` | `15000` | URL check timeout in ms (15s) |
| `LOG_LEVEL` | `info` | Log level (trace/debug/info/warn/error/fatal) |

## API Reference

### Health Check

```
GET /health
```

Response:
```json
{ "status": "ok", "uptime": 123.45, "timestamp": "2026-03-03T08:00:00.000Z" }
```

---

### Check Single URL

```
GET /check?url=https://example.com
```

Response:
```json
{
  "url": "https://example.com",
  "status": 200,
  "ok": true,
  "redirect": false,
  "finalUrl": "https://example.com",
  "responseTime": 123
}
```

### Check Multiple URLs

```
POST /check
Content-Type: application/json

{
  "urls": [
    "https://example.com",
    "https://google.com"
  ]
}
```

Response: Array of check results (max 100 URLs per request).

---

### Convert Image

```
POST /convert
Content-Type: multipart/form-data
```

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `format` | `webp\|jpg\|png` | `webp` | Output format |
| `quality` | `1–100` | `80` | Output quality |
| `width` | `int` | — | Resize width (px) |
| `height` | `int` | — | Resize height (px) |
| `fit` | `cover\|contain\|inside\|fill\|outside` | `cover` | Resize fit mode |

**Response:** Binary image with appropriate `Content-Type` header.

---

### Compress Image

```
POST /compress
Content-Type: multipart/form-data
```

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `quality` | `1–100` | `75` | Compression quality |
| `lossless` | `boolean` | `false` | Lossless compression (WebP/PNG) |
| `effort` | `0–6` | `4` | Compression effort level |
| `format` | `webp\|jpg\|png` | — | Force output format (default: keep original) |

**Response:** Binary image with appropriate `Content-Type` header.

---

## curl Examples

```bash
# Health check
curl http://localhost:3000/health

# Check single URL
curl "http://localhost:3000/check?url=https://example.com"

# Check multiple URLs
curl -X POST http://localhost:3000/check \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com","https://google.com"]}'

# Convert PNG to WebP (quality 80)
curl -X POST "http://localhost:3000/convert?format=webp&quality=80" \
  -F "file=@input.png" -o output.webp

# Convert and resize to 400x300
curl -X POST "http://localhost:3000/convert?format=webp&width=400&height=300&fit=cover" \
  -F "file=@input.jpg" -o resized.webp

# Compress JPEG (quality 60)
curl -X POST "http://localhost:3000/compress?quality=60" \
  -F "file=@photo.jpg" -o compressed.jpg

# Compress to WebP lossless
curl -X POST "http://localhost:3000/compress?format=webp&lossless=true" \
  -F "file=@input.png" -o output.webp
```

## n8n Integration

Use the **HTTP Request** node with these settings:

### URL Check

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `http://internal-tool:3000/check?url={{ $json.url }}` |

### Convert Image

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `http://internal-tool:3000/convert?format=webp&quality=80` |
| Body Content Type | `Form-Data/Multipart` |
| Parameter Name | `file` |
| Input Data Field Name | `data` (or your binary field name) |

### Compress Image

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `http://internal-tool:3000/compress?quality=60` |
| Body Content Type | `Form-Data/Multipart` |
| Parameter Name | `file` |
| Input Data Field Name | `data` (or your binary field name) |

> **Tip:** When running both n8n and internal-tool in Docker, use the container name (`internal-tool`) as the hostname. Add both services to the same Docker network.

## Error Responses

All errors return JSON:

```json
{
  "error": "ValidationError",
  "message": "Missing 'url' query parameter",
  "statusCode": 400,
  "requestId": "abc-123"
}
```

| Status | Meaning |
|---|---|
| `400` | Invalid parameters or missing file |
| `413` | File too large |
| `415` | Unsupported image format |
| `500` | Internal server error |

## License

MIT
