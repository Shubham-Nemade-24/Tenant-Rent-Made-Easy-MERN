# Rental Rooms Ledger

Mobile-friendly Streamlit app for the ten permanent rooms: 11–15 and 21–25. It records tenants, monthly rent, electricity readings, payments, and carried-forward balances.

## Free deployment: MongoDB Atlas + Streamlit Community Cloud

1. Create a free MongoDB Atlas **Free** cluster. It is sufficient for this small ledger (MongoDB documents its Free cluster as a small, free-forever environment).
2. In Atlas, create a database user with a strong password. Under **Network Access**, add `0.0.0.0/0`; this is needed because Streamlit Cloud's outgoing IP can vary. The database is still protected by the username/password in the connection URI.
3. Click **Connect → Drivers → Python**, copy the `mongodb+srv` connection string, and replace its password safely (URL-encode special password characters).
4. Copy `.streamlit/secrets.toml.example` to `.streamlit/secrets.toml` locally and add the real values. This file is ignored by Git.
5. Test locally:

   ```bash
   python -m pip install -r requirements.txt
   streamlit run app.py
   ```

6. Push these files to GitHub. In Streamlit Community Cloud, create an app from the repository with `app.py` as the entry point. In **Advanced settings → Secrets**, paste the real secret values, then deploy.

The web app can be the only place you manage the records. MongoDB Atlas is just the secure storage service behind it.

## How the monthly ledger works

- The dashboard starts on the current month. Previous/Next creates and shows a month when needed.
- A new month automatically takes the previous month’s unpaid amount as its previous balance and the previous month’s current meter reading as its previous reading.
- `Total = rent + light bill + previous balance`.
- Every saved payment is added together. Green means paid in full, yellow means partly paid, and red means no payment yet.
- In Electricity, enter only current readings. Units are `current - previous`; bill is units × ₹15.
- Tenant changes made in a month apply to that month and months already created after it. Earlier month records remain historical.

## Important free-tier behavior

The database itself is persistent, unlike a local SQLite file on a free hosted app. Atlas Free provides a small free cluster and is more than enough for ten rooms. It is intended for small/personal projects; use a paid plan later if you need guaranteed performance, automated backups, or high availability. Streamlit Community Cloud may put an app to sleep after no traffic, so a first visit after a long gap can require waking it; normal day-to-day use is responsive.
