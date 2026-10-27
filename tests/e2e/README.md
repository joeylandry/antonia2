# End-to-end tests

These run against a real Supabase project, so they are **not** part of `npm test`.
Use a dedicated test project (never production) with a test trainer account, then:

```bash
E2E_EMAIL=test-trainer@example.com E2E_PASSWORD='…' npm run test:e2e
```

The suite creates a uniquely named client and deletes it at the end.
