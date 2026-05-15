# Notification Integration Tests

These integration tests validate notification behavior against real local dependencies:

- SMTP provider: `smtp4dev` (default) or `mailhog`
- Mock WebPush endpoint: `wiremock`

## 1) Start test dependencies

From repository root:

```bash
docker compose -f docker-compose.notifications-test.yml up -d
```

Use MailHog instead of smtp4dev (optional):

```bash
docker compose -f docker-compose.notifications-test.yml --profile mailhog up -d
```

## 2) Run integration tests

From `flossk-ms` directory:

```bash
RUN_NOTIFICATION_INTEGRATION_TESTS=true dotnet test FlosskMS.Tests/FlosskMS.Tests.csproj --filter "FullyQualifiedName~NotificationIntegrationTests"
```

With MailHog:

```bash
RUN_NOTIFICATION_INTEGRATION_TESTS=true NOTIFICATION_TEST_SMTP_PROVIDER=mailhog dotnet test FlosskMS.Tests/FlosskMS.Tests.csproj --filter "FullyQualifiedName~NotificationIntegrationTests"
```

## 3) What the tests verify

- `EmailService_SendsPasswordReset_ToSmtpProvider`
  - Sends a real SMTP email through smtp4dev/mailhog.
  - Polls provider HTTP API to verify the recipient appears in captured messages.

- `PushNotificationService_SendsWebPush_ToWireMockEndpoint`
  - Sends a WebPush message with generated VAPID keys.
  - Polls WireMock request journal and verifies a `POST /push` request was received.

## Useful endpoints

- smtp4dev UI: `http://localhost:5000`
- mailhog UI: `http://localhost:8025`
- wiremock admin: `http://localhost:8081/__admin/requests`

## Environment overrides

You can override defaults using:

- `NOTIFICATION_TEST_SMTP_PROVIDER` (`smtp4dev` or `mailhog`)
- `NOTIFICATION_TEST_SMTP_HOST`
- `NOTIFICATION_TEST_SMTP_PORT`
- `NOTIFICATION_TEST_SMTP4DEV_MESSAGES_URL`
- `NOTIFICATION_TEST_MAILHOG_MESSAGES_URL`
- `NOTIFICATION_TEST_PUSH_ENDPOINT`
- `NOTIFICATION_TEST_WIREMOCK_REQUESTS_URL`
- `NOTIFICATION_TEST_WIREMOCK_RESET_URL`