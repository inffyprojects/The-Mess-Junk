# How to edit the website — a guide for the team

This guide is for Aditi, Abhinav and Khadija. It covers the things you will
actually do: adding workshops, changing prices, updating upcoming dates, and
editing FAQ answers. No coding, no Git, no terminal.

---

## Logging in

1. Go to your website and add `/admin` to the address. For example, if your site
   is at `themessjunk.in`, go to `themessjunk.in/admin`.
2. Click **Login with GitHub**.
3. Sign in with the GitHub account that has access to the project repository. You
   only need to do this once per browser — it remembers you after that.

You will see a dashboard with four sections: Workshops, FAQ, Pricing Tiers, and
Upcoming Dates.

---

## Adding a new workshop

1. Click **Workshops** in the sidebar.
2. Click **New Workshop** at the top.
3. Fill in the fields. Every field has a short explanation underneath it. The
   important ones:
   - **Workshop title** — the name visitors see.
   - **Summary** — one line, about 90 characters. Shown on the card.
   - **Categories** — pick at least one. This controls which filter tabs show
     the workshop. Most workshops belong to two or three.
   - **Starting price** — digits only, no rupee symbol. Shown as "From Rs.1,200".
   - **Image slot ID** — ask the developer which slot to use. If you are not
     sure, use any existing workshop's slot for now.
   - **Hidden (draft)** — leave this off for a live workshop. Turn it on to hide
     a workshop without deleting it (see "Hiding a workshop" below).
   - **Description** — two or three short paragraphs about the session.
4. Click **Publish** (or **Save** if you see that instead).
5. Wait about a minute. The site rebuilds automatically after every change.

## Editing an existing workshop

1. Click **Workshops**, then click the workshop you want to change.
2. Edit any field.
3. Click **Publish** (or **Save**).

## Hiding a workshop for the season

If a workshop is not running right now but you want to bring it back later,
do not delete it. Instead:

1. Open the workshop.
2. Turn on **Hidden (draft)**.
3. Save.

The workshop disappears from the site but stays in the system. Turn the switch
off again when the season comes back.

---

## Changing prices

There are two kinds of price on the site:

**A workshop's "From" price** — open the workshop and change the **Starting
price** field.

**The three tiers on the Pricing page** — click **Pricing Tiers** in the
sidebar, then click **Pricing tiers**. You will see a list of the three pricing
cards. Click the one you want to change.

- **Price text** is free text, so it can say "Rs.499 - Rs.2,500" or "Custom" or
  "Let's talk".
- **What is included** is the bulleted list on the card. Click the small + to add
  a line, or the x to remove one.
- **Featured** makes one card stand out visually. Keep it turned on for exactly
  one tier.

---

## Adding upcoming dates

These are the sessions shown on the Contact page under "Check a date".

1. Click **Upcoming Dates** in the sidebar, then click **Upcoming dates**.
2. You will see the list of all scheduled sessions. Click the small + button at
   the bottom to add a new one.
3. Fill in:
   - **ID** — use the format `2026-08-08-pottery` (date and workshop name). This
     is just for your reference.
   - **Date** — pick from the calendar.
   - **Time** — type it as text, e.g. "11:00 AM - 1:30 PM".
   - **Workshop name** — type the exact workshop title so the enquiry form
     pre-fills correctly.
   - **Total seats** and **Seats left** — update seats left whenever a booking
     comes in. Setting seats left to 0 shows the session as "Full".
   - **Starting price** — leave empty to use the workshop's own price.
4. Save.

Past dates disappear from the site automatically on the next rebuild. If the
list empties completely, the site shows a polite "dates are being set" message
instead of an empty grid. Keep the list stocked with the next few sessions.

## Updating seats left

When someone books a seat:

1. Open **Upcoming Dates**, then click **Upcoming dates**.
2. Find the session in the list and click to expand it.
3. Change **Seats left** to the new number.
4. Save.

When seats left reaches 0, the session shows as "Full" on the site. When it
drops below a quarter of the total (minimum 2), the site shows an "N left"
badge automatically.

---

## Editing the FAQ

1. Click **FAQ** in the sidebar.
2. Click an existing question to edit it, or click **New Question** to add one.
3. Fill in:
   - **Question** — write it as a visitor would ask it.
   - **Section** — which part of the FAQ page it appears in.
   - **Answer** — keep it to two or three sentences.
4. Save.

---

## What happens after you save

Every time you save a change, the site rebuilds automatically. This takes about
a minute. After that, your change is live on the website.

If something looks wrong after a change, open the same entry in the admin panel
and check for typos. The most common mistake is a workshop name in the upcoming
dates list that does not match the actual workshop title exactly — the date
still works, but the enquiry form will not pre-select the workshop.

---

## Uploading photos

When you have photos from the photographer:

1. In the admin panel, look for the image upload button when editing a workshop
   or other entry.
2. Upload the photo. It will be saved to the project and processed automatically
   into the right sizes and formats.

The developer may need to connect the uploaded photo to the right place on the
site the first time. After that, replacing a photo is just uploading a new one
in the same slot.

---

## If something goes wrong

- **The site looks the same after saving** — wait a minute, then refresh the
  page. The rebuild takes a little time.
- **A field shows an error** — read the hint text under the field. It usually
  says what format is expected.
- **You accidentally deleted something** — every change is saved in the
  project's history. Ask the developer to restore it. Nothing is permanently
  lost.
- **You cannot log in** — make sure you are using the GitHub account that has
  access to the project. If you are locked out, ask the developer to check
  your access.
