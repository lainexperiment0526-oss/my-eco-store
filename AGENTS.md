# Architecture rules

- Authentication emails use the managed `auth-email-hook` scaffold and shared React Email templates; deploy the hook after template changes because hosted email delivery uses deployed code.
- Use managed email sending rather than application-owned queues or cron jobs because this project’s email service handles delivery infrastructure.
- Keep Pi Browser detection and native ad playback in the shared Pi ad adapter; await initialization, check native capabilities, and serialize native ads so all triggers follow the same SDK contract.
- Automatic sign-in and app-open ads use interstitials rather than rewarded ads because these flows do not offer a verified user reward.
