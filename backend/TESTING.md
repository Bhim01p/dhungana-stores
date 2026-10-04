# Backend database tests

The current model tests create and delete categories, products, and orders. They must use a dedicated, disposable database.

## Local PostgreSQL

Create an empty database named `dhungana_stores_test`, then set its connection string in the shell where you run tests:

```powershell
$env:TEST_DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/dhungana_stores_test"
Set-Location backend
npm test
```

Use your local PostgreSQL password in the command. The tests use `TEST_DATABASE_URL` instead of `DATABASE_URL`, and stop if the two values match. By default, tests only accept a loopback database host.

## Dedicated remote test database

If you create a separate Neon test branch or another remote test database, set both values only in your current terminal session:

```powershell
$env:TEST_DATABASE_URL = "<dedicated-test-database-url>"
$env:ALLOW_REMOTE_TEST_DATABASE = "true"
Set-Location backend
npm test
```

Do not use the production connection string for `TEST_DATABASE_URL`. The test suite deletes the records it creates, but it is still destructive to whatever database it is pointed at. The remote opt-in is intentional; it does not make a production database safe for testing.
