#### The API.md document explains the interface for implementing new jobs.

### Google Sheets Integration

The `sheets` folder conatin implementation for Google Sheets extension. Also a demo extension for emailing responses is present in the `mail` folder.Example configuration for these jobs are:

```json
{
  "sheets": {
    "redisURL": "redis://127.0.0.1:6379",
    "cmd": "node",
    "args": ["index.js"],
    "concurrency": 5,
    "cwd": "sheets"
  },
  "mail": {
    "redisURL": "redis://127.0.0.1:6379",
    "cmd": "python3",
    "args": ["main.py"],
    "concurrency": 5,
    "cwd": "mail"
  }
}
```

### The logs for the workers will be stored inside the `/worker-logs` folder.
