# TODO List

## 🔝 High Priority

- [ ] **Login Redirect**
    - Redirect to main page if user is already logged in and lands on login page.

- [ ] **Client: Full Name**
    - Support full name (first + last or single field).

- [ ] **Client: Collapsible Sections**
    - Make "Calls" and "Projects" sections collapsible in client view.

- [ ] **Calls: Improved UX**
    - Allow editing and deleting calls.
    - Hide "new call" form until "+" button is clicked.

- [ ] **Back Links**
    - Add a "← Back" link at the top of views where appropriate.

## ⚙️ Medium Priority

- [ ] **Backup to Dropbox**
    - Backup DB to JSON with timestamp.
    - Trigger from dashboard via button.

- [ ] **Call Contact Method**
    - Include icons for contact method (e.g. phone, whatsapp, in-person).

- [ ] **Projects View Enhancements**
    - Color by state:
        - No date: future
        - Tentative, Confirmed, WIP, Done
    - Filter by client.
    - Reuse filter in Client view (pre-filtered).

- [ ] **Location Handling**
    - Support "studio" or address.
    - Consider linking to map.

## 🧠 Low Priority

- [ ] **Menu Restriction**
    - Restrict menu to show "dashboard" only when logged in.

- [ ] **Dropbox Naming Convention**
    - Standard: `2005_name`
    - Admin-only: `_2005_name`
    - Show admin folders only in admin.

- [ ] **Filename Convention**
    - Format: `name_2005_tag1_tag2_tag3_fav.jpg`

- [ ] **Optimized File Loading**
    - Preload all files like "Hidden" page.
    - Cache results and refresh on restart.

- [ ] **Slideshow Source**
    - Use files tagged with `fav` from full list.

- [ ] **Category Source**
    - Use full list filtered by tag/category/admin/small.

- [ ] **Tag Definitions**
    - Create `categories.txt` file to define tags for menu and filtering.

---

_This file helps track upcoming enhancements and priorities for the photography admin site._
