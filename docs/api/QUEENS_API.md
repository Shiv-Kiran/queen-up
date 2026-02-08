# Queens API

## `GET /api/puzzles`
- Returns puzzle summaries for navigation and counter.

Response:
```json
{
  "total": 53,
  "items": [
    { "id": 1, "index": 1, "difficulty": "MEDIUM", "createdAt": "2026-02-08T18:00:00.000Z" }
  ]
}
```

## `GET /api/puzzles/by-index/:index`
- Returns puzzle board data without the solution.

Response:
```json
{
  "id": 1,
  "index": 1,
  "total": 53,
  "difficulty": "MEDIUM",
  "createdAt": "2026-02-08T18:00:00.000Z",
  "puzzle": {
    "size": 9,
    "regionGrid": [[0,0,0,1,1,2,2,2,2]],
    "revealedQueens": [{ "row": 0, "col": 3 }],
    "generatedAt": "2026-02-08T18:00:00.000Z"
  }
}
```

## `POST /api/puzzles/:id/validate`
- Validates the submitted queen positions against puzzle constraints and stored solution.

Request:
```json
{
  "queens": [
    { "row": 0, "col": 3 }
  ]
}
```

Response:
```json
{
  "valid": false,
  "errors": ["Each row must contain exactly one queen."]
}
```

## `POST /api/admin/generate-daily`
- Protected endpoint for GitHub Actions.
- Required header: `x-admin-token: <PUZZLE_ADMIN_TOKEN>`

Response:
```json
{
  "created": 1,
  "puzzleId": 54
}
```

## `POST /api/admin/generate-batch`
- Protected endpoint for initial/backfill generation.
- Required header: `x-admin-token: <PUZZLE_ADMIN_TOKEN>`
- Optional body:

```json
{
  "count": 30,
  "minClues": 3
}
```
