# Architecture rules

- Authentication emails use the managed `auth-email-hook` scaffold and shared React Email templates; deploy the hook after template changes because hosted email delivery uses deployed code.
- Use managed email sending rather than application-owned queues or cron jobs because this project’s email service handles delivery infrastructure.
