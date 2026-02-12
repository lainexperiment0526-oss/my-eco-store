# Pi Network & Ad Network Integration Guide

## 1. Configuration
- Your Pi API key and validation key are stored securely in `pi.config.js`.
- Never expose these keys in frontend code or public repos.

## 2. Frontend Setup
- Pi SDK is loaded in `index.html` and initialized with all required scopes:
  - `payments`, `username`, `wallet_address`
- Authentication is handled on page load. Incomplete payments are logged and can be sent to backend for completion.

## 3. Backend Setup
- Backend endpoints for payment approval, completion, and rewarded ad verification are in `src/server/piPayments.js`.
- The backend uses the API key from `pi.config.js` for all requests to Pi Platform API.
- Endpoints:
  - `POST /approve-payment` — Approves a payment (requires `paymentId`)
  - `POST /complete-payment` — Completes a payment (requires `paymentId`, `txid`)
  - `POST /verify-rewarded-ad` — Verifies a rewarded ad (requires `adId`)

## 4. Usage
- On the frontend, after a rewarded ad is shown, send the `adId` to `/verify-rewarded-ad` and only reward the user if `mediator_ack_status` is `"granted"`.
- For payments, follow the Pi SDK payment flow and use the backend endpoints for server-side approval and completion.

## 5. References
- [Official Pi Platform Docs](https://github.com/pi-apps/pi-platform-docs)
- [SDK Reference](https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md)
- [Payments](https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md)
- [Ads](https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md)

---

For any integration issues, check the logs and ensure your API key is correct and not exposed to the frontend.
