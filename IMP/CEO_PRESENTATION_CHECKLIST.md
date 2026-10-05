# CEO_PRESENTATION_CHECKLIST.md

Pre-Presentation Check — Market Bytes CRM

Run through this before the meeting. Check each item live, on the actual environment you're presenting from.

---

## 1. Access & Security

- [ ] Account creation only happens through the authenticated invite flow — no public signup path exists.
- [ ] JWT/session handling confirmed working — login issues a token, and the token is honored on subsequent requests.
- [ ] Each role sees exactly what it should:
  - [ ] Super Admin — full visibility across clients.
  - [ ] Client Admin — sees only their own client's data.
  - [ ] Sales Rep — sees only their assigned tenant's leads, no access to admin-level pages.
- [ ] Deactivating a test account immediately blocks that account from logging in again.

## 2. Core Flow

- [ ] Login works cleanly for all three roles — no errors, correct landing page/data for each.
- [ ] A test lead submitted through Meta's Lead Ads Testing Tool flows end to end and appears correctly in the right client's inbox.
- [ ] Lead status can be updated (New → Contacted → Negotiating → Won/Lost) and the change persists.
- [ ] Notes can be added to a lead and show up correctly.
- [ ] A Client Admin can invite a Sales Rep, and the new account can log in and see the right tenant's data.

## 3. Data Integrity

- [ ] Two or more test clients are isolated from each other — neither sees the other's leads, notes, or team members.
- [ ] A lead submitted through a form with multiple question types (short answer, dropdown, checkbox/multi-select) is captured correctly, including multi-select answers.
- [ ] Custom form questions specific to one client don't appear or interfere with another client's data.

## 4. Presentation Readiness

- [ ] Demo accounts are set up, clean, and clearly labeled.
- [ ] The environment you're presenting from matches what you just tested — no untested last-minute changes.
- [ ] A backup screen recording of the working flow exists in case anything glitches live.
- [ ] You know the order you'll walk through: login → lead arrives → pipeline → team invite (or whatever sequence tells the story best).

## 5. Final Check

- [ ] Every box above is checked, on the actual environment, within the last hour.

If everything above is checked, you're ready.
