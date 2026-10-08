# Placement Portal: Full Code Walkthrough

A MERN-stack campus placement portal (React frontend, Express + MongoDB backend). Two roles: **Admin** (placement cell) and **Student**. About 3,400 lines across 40 source files. Line numbers below refer to your files.

---

## 1. Big picture

```
 React app (CRA, port 3000)                 Express API (port 4000)               MongoDB
 ───────────────────────────                ───────────────────────               ───────
 Login.js ── POST /user/login ───────────▶  Auth.login: bcrypt + JWT  ──────────▶  users
   ◀── JWT in httpOnly-less cookie + body    cookie "token" (secure, SameSite=None)
 UserContext holds {_id,name,email,role}
 Every later call: axios {withCredentials}─▶ auth middleware reads cookie ─▶ isAdmin / isStudent ─▶ controller
```

**Tech stack:** React 18, react-router-dom v6, axios, Bootstrap 5, react-hot-toast, SheetJS (`xlsx`) on the client; Express 4, Mongoose 8, bcrypt, jsonwebtoken, nodemailer, cookie-parser, cors, moment-timezone on the server. Deployed on Render.

**Data model (two-way link):**

- `User.placementCards[]` → `{placementCard: ObjectId, selected, resultsPosted}`
- `PlacementCard.User[]` → `{user: ObjectId, selected}`

Applying writes to **both** sides. Posting results updates **both** sides. That duplication makes student queries fast but means both must stay in sync.

### Workflow A: Admin

1. Admin account exists in DB (created manually, because `/signup` is admin-only).
2. Login → `/adminHome` → 5 tiles: Add Student, Post Job, Post Results, Check Jobs, Update GPA.
3. **Add Student** → `POST /user/signup` (default password `12345`).
4. **Post Job** → `POST /job/createJob` (title, company, salary, branches, deadline, min CGPA).
5. Students apply (see B). Admin opens **Check Jobs** → downloads an Excel of applicants (`POST /job/getStudentsAppliedForJob`, built into .xlsx in the browser).
6. Company shortlists offline. Admin opens **Post Results** → picks a job → uploads an Excel with selected student `id`s (or ticks checkboxes) → confirmation modal → `POST /job/uploadResultsOfJob`.
7. Once results are posted, the job card says "View Results" and shows the selected list (`/job/getStudentsSelectedForJob`).
8. **Update GPA**: upload Excel (`id,name,branch,gpa`) → one `POST /job/uploadGpa` per row.

### Workflow B: Student

1. Admin-created account → logs in with email + password → `/studentHome`.
2. `GET /job/getJobs` returns four lists: **available** (matching branch, not expired, CGPA ≥ job minimum, not yet applied), **applied**, **selected**, **not selected**.
3. Click **Apply** → `POST /job/applyJob` → job moves to "Applied".
4. After the admin posts results, it moves to "Selected" or "Not Selected".

### Workflow C: Forgot password

Email → server makes an 8-char OTP, stores it with a 3-minute expiry, emails it → user enters OTP → `verifyOtp` → user enters new password → `changePassword`.

---

## 2. Backend

### `backend/package.json` (21 lines)

- 3–7: entry `index.js`; `npm start` = plain node, `npm run dev` = nodemon (auto-restart).
- 8–20: dependencies. `bcrypt` hashes passwords, `jsonwebtoken` signs tokens, `cookie-parser` fills `req.cookies`, `cors` allows the frontend origin, `dotenv` loads `.env`, `moment-timezone` does dates, `nodemailer` sends OTP mail, `uuid` makes OTPs. `nodemon` is listed as a runtime dependency, but it should be a devDependency.

### `backend/index.js` (40 lines): server bootstrap

- 1–3: import express and cors, create `app`.
- 5: `express.json()` parses JSON bodies into `req.body`.
- 7–16: CORS config. `origin` is hard-coded to your deployed frontend, so **local development at localhost:3000 will be blocked** unless you change it. `credentials: true` lets cookies cross origins. `methods` and `allowedHeaders` whitelist what browsers may send. `maxAge: 600` caches preflight for 10 minutes. `optionsSuccessStatus: 204` answers preflight with 204.
- 17: loads `.env` (it runs after CORS setup, which is fine because the origin isn't read from env).
- 18–19: `cookie-parser` makes the `token` cookie available as `req.cookies.token`.
- 23: port from env, default 4000.
- 26–27: call the DB connector.
- 30–34: mount routers. `/user/*` → auth routes; `/job/*` → placement routes.
- 36–38: start listening.

### `backend/config/database.js` (17 lines)

- 1–3: import mongoose, load env.
- 5–15: `dbConnect` calls `mongoose.connect(process.env.DATABASE_URL, {...})`. `useNewUrlParser` and `useUnifiedTopology` are deprecated no-ops in Mongoose 8 and can be removed. `.then` logs success; `.catch` logs the error.
- 17: export it.

### `backend/module/User.js` (51 lines)

- 4–17: **sub-schema** `placementCardInUserSchema`: a reference to a PlacementCard (`ref` enables `.populate()`), plus `selected` and `resultsPosted` flags (default false). Together they encode status: no results → "applied"; resultsPosted & selected → "selected"; resultsPosted & !selected → "not selected".
- 19–49: `userSchema`.
  - `name`, `email`, `password`: required; `trim` strips spaces. `email` is **not `unique`**; duplicates are only prevented in code.
  - `role`: enum Admin/Student. `branch`: enum cse/it/ece. `cgpa`: String (so numeric comparison requires conversion, see `getJobs`).
  - `resetPasswordOtp` + `resetPasswordOtpExpiration`: temporary reset fields.
  - `placementCards`: array of the sub-schema.
- 51: registers model "User" (collection `users`).

### `backend/module/PlacementCard.js` (47 lines)

- 4–13: sub-schema `userInPlacementCardSchema`: `{user → User, selected}`.
- 15–45: `placementcardSchema`: `title`, `Company`, `Salary` (strings, required), `branch` (array of strings: which branches may apply), `expiretime` (deadline Date), `resultsPosted` flag, `cgpa` (minimum CGPA as string, default "0"), and `User` (applicants).
- 47: registers model "PlacementCard".

### `backend/routes/user.js` (16 lines)

Route table with middleware chain (runs left to right):

| Route | Middleware | Handler |
| --- | --- | --- |
| POST `/user/signup` | `auth`, `isAdmin` | `signUp` |
| POST `/user/login` | none | `login` |
| GET `/user/logout` | none | `logout` |
| POST `/user/sendOtpForResetPswd` | none | send OTP |
| POST `/user/verifyOtp` | none | check OTP |
| POST `/user/changePassword` | none | set new password |

Line 3 (`router = express.Router()`) lacks `const`, creating an implicit global. It works but is sloppy.

### `backend/routes/placement.js` (17 lines)

| Route | Who | Handler |
| --- | --- | --- |
| POST `/job/createJob` | Admin | `createJob` |
| GET `/job/getJobs` | Student | `getJobs` |
| POST `/job/applyJob` | Student | `applyJob` |
| GET `/job/getAllJobsByAdmin` | Admin | all jobs |
| POST `/job/getStudentsAppliedForJob` | Admin | applicants |
| POST `/job/uploadResultsOfJob` | Admin | post results |
| POST `/job/getStudentsSelectedForJob` | Admin | selected list |
| POST `/job/uploadGpa` | Admin | update one GPA |

### `backend/Middleware/auth.js` (70 lines): authentication and role guards

- 5–34 `auth`:
  - 7: token is looked up in **body → cookie → Authorization header** (first one found wins). The frontend uses the cookie.
  - 8–14: missing token → 401.
  - 16: `jwt.verify` with `JWT_KEY` (throws if invalid/expired).
  - 19: **`req.user = payload`**, which holds `{email, id, role}` from login. Every downstream controller reads identity from here.
  - 20–25: invalid → 401. 26: `next()` hands over.
  - 27–33: outer catch (e.g. no Authorization header → `.replace` of undefined). It returns 401 but with `success:true`, which is a typo.
- 36–51 `isStudent`: `req.user.role !== 'Student'` → block (status 500; 403 would be correct).
- 53–70 `isAdmin`: same for `'Admin'`. Line 54 logs the role.

### `backend/controllers/Auth.js` (300 lines)

**Imports (1–8):** User model, bcrypt, jwt, nodemailer, uuid. Line 4 imports `nodemon` unnecessarily and should be deleted.

**`signUp` (10–45)**

- 12: destructure fields from the body. 13–19: reject if the email exists.
- 20–29: hash the password with 10 salt rounds; on failure → 500.
- 30–32: `User.create(...)`. **It isn't awaited**, so the response says success before the write finishes and DB errors (e.g. validation) are silently lost.
- 33–36: success JSON.
- 38–44: catch. It returns status 200 with `success:false`, which is inconsistent.

**`login` (47–113)**

- 50–56: both fields required.
- 57–64: find user by email.
- 66–70: JWT payload `{email, id, role}`.
- 72: `bcrypt.compare(plain, hash)`.
- 74–79: sign a token valid **2 hours**.
- 81–83: convert the Mongoose doc to a plain object, attach the token, **remove the password hash** from the response.
- 85–90: cookie options: expires 24 h (but the JWT inside expires in 2 h), `secure` (HTTPS only), `sameSite:'None'` (needed for cross-site cookies between two Render domains). It isn't `httpOnly`, so JS can read it.
- 91–96: respond with token + user.
- 98–103: wrong password → 400. 105–111: server error.

**`logout` (115–130):** `res.clearCookie('token')` + success.

**`sendOtpForResetPswd` (133–208)**

- 135–143: email required. 146–152: user must exist (404 otherwise).
- 155: OTP = first segment of a UUID v4 (8 hex chars).
- 158–159: now + 3 minutes.
- 162–164: store OTP + expiry on the user, save.
- 167–173: Gmail SMTP transport using `EMAIL_USER`/`EMAIL_PASS` env vars.
- 176–182: mail content (text + HTML).
- 185–199: send; on success reply 200. **The reply includes `otp` in the JSON** (line 196), so anyone calling the API sees the OTP and the reset is meaningless. Remove that field.

**`verifyOtp` (210–251):** checks the user exists, compares stored OTP with the one sent, and checks the expiry (232). If no OTP was ever requested, `user.resetPasswordOtp.toString()` throws and the user gets a 500, so use optional chaining.

**`changePassword` (253–300):** finds user by email, hashes `newPassword`, saves, and clears the OTP fields (279–280). **It never checks that an OTP was verified**, so anyone who knows an email can reset that account's password by calling this endpoint directly. This is the most serious issue in the project (see §5).

### `backend/controllers/PlacementController.js` (396 lines)

**Imports (1–4):** both models, `moment-timezone`, jwt (unused).

**`createJob` (6–34)**

- 8: destructure `{title, Company, Salary, branch, expiretime, cgpa}`.
- 10–16: rejects duplicate **titles** (so two companies can't both post "SDE").
- 17–25: create and return the job.
- 27–33: error branch, returned with status 200 (inconsistent).

**`getJobs` (36–112): the most important student query**

- 38–39: logged-in user id from `req.user` (set by `auth`).
- 42–48: load the user; 404 if gone.
- 53–54: the student's CGPA and branch.
- 55–56: current time as an ISO string, reformatted into `...SSS[Z]` (redundant; `new Date()` would do).
- 58–60: IDs of jobs where `selected && resultsPosted` → **selected**.
- 62–64: `resultsPosted && !selected` → **not selected**.
- 66–68: `!resultsPosted && !selected` → **applied (pending)**.
- 71–80: Mongo query for open jobs:
  - `branch: userBranch` matches because `branch` is an array containing the value;
  - `expiretime: {$gt: now}`: deadline not passed;
  - `$expr` + `$toDouble("$cgpa") <= parseFloat(userCGPA)`: job's minimum CGPA is ≤ student's CGPA (needed because both are stored as strings).
- 84–88: remove jobs the student already applied to / has results for.
- 91–94: re-fetch each job by id with `findById` (N+1 queries; `.populate('placementCards.placementCard')` or `find({_id:{$in:ids}})` would be one query). Line 94 even re-fetches jobs it already has.
- 97–104: return four arrays.
- Note: an applied job whose deadline has passed still shows under "applied", which is correct, because the filter on expiry only affects *available*.

**`applyJob` (118–181)**

- 120–131: job id from the body, student from the token.
- 134–140: find the job.
- 145–152: loop over `job.User` to detect a previous application (`.some()` would be neater).
- 154–159: 400 if already applied.
- 162–163: push `{user, selected:false}` onto the job and save.
- 166–167: push `{placementCard, selected:false}` onto the student and save.
- Gaps: it doesn't re-check the deadline, branch or CGPA on the server, so a crafted request can bypass the UI filter. The two saves aren't in a transaction.

**`getAllJobsByAdmin` (183–196):** `PlacementCard.find({})`. Returns every job with its applicants array.

**`getStudentsAppliedForJob` (199–240)**

- 201–210: find job by `jobid`.
- 213: applicant ids. 216: `User.find({_id: {$in: ids}})`.
- 219–225: shape each into `{name,email,userId,selected,branch}`. **`user.selected` is always `undefined`** because `selected` isn't a field on the User model (it lives inside `placementCards[]`). The frontend's "already selected" check therefore never triggers.
- 227–232: respond with the list + job title + company.

**`uploadResultsOfJob` (242–323): the most intricate function**

- 245: `jobid` and `selectedUserIds` (array of user id strings).
- 247–253: load the job.
- 256–257: mark the card `resultsPosted = true`.
- 259: `const flag = true`. Later `flag = false` (lines 284, 297) would throw "Assignment to constant" if those branches ever ran. They can't today, because `updateOne` always returns an object. Use `let` or drop the flag.
- 261: all applicant ids as strings. 263: **non-selected = all applicants − selected**.
- 264–290 (if some selected):
  - 266–269: set `resultsPosted:true` again (redundant, already done on 256).
  - 270–275: for each selected id: `updateOne({_id:jobid,'User.user':userId}, {$set:{'User.$.selected':true}})`. The positional `$` operator updates the matching array element.
  - 279–282: on the **User** side, `updateMany` over all selected students whose `placementCards.placementCard` equals this job, setting `resultsPosted` and `selected` to true.
- 291–303: same for non-selected students (`selected:false, resultsPosted:true`).
- 305–315: respond.
- Any id in `selectedUserIds` who never applied is silently ignored by the filters. This is good, but no feedback is given.

**`getStudentsSelectedForJob` (325–364):** filter `job.User` for `selected:true`, load those users, return their details. (`user.selected` is again undefined in the mapping at 346, which is harmless here.)

**`uploadGpa` (366–397):** `findOneAndUpdate({_id:id}, {$set:{cgpa:gpa}}, {new:true})`; 404 if no such student. `gpa` arrives from Excel as a number and Mongoose casts it to String. It returns the whole updated student, **including the password hash**; trim it with `.select('-password')`.

---

## 3. Frontend

All API calls use `process.env.REACT_APP_API_BASE_URL` (set in the frontend `.env`) and `{withCredentials:true}` so the browser sends the login cookie.

### `public/index.html` (43 lines)

Standard CRA template. `<div id="root">` (31) is where React mounts. Line 27: the `<title>` is still "React App", so change it to "V Place". Lines 8–11: default meta description. 12, 17: icons and `manifest.json` for PWA metadata.

### `package.json` (48 lines)

Dependencies (6–22): `react-scripts` build tooling, `axios` HTTP, `bootstrap` styling, `moment` dates, `react-hot-toast` notifications, `react-icons` (eye icons), `react-router-dom` routing, `xlsx` Excel read/write. `@reduxjs/toolkit`, `react-redux`, `@material-ui/icons` are installed but **unused**. Scripts (24–29) are the CRA commands. `eslintConfig`/`browserslist` (30–47) are CRA defaults.

### `src/index.js` (17 lines)

- 1–4: imports (`useState` unused).
- 8: `createRoot` on `#root`.
- 9–15: renders `<App/>` wrapped in `<UserProvider>`, so **every component can read the logged-in user**.

### `src/user-context.js` (28 lines): global state

- 3: `createContext({})`.
- 6–7: two pieces of state: `user` (null when logged out) and `jobId` (the job the admin is currently working on).
- 9–19: helpers `login(userData)`, `logout()`, `setJob(id)`.
- 22: provides `{user, login, logout, jobId, setJob}` to the tree.
- 28: `useUser()` hook = `useContext`.
- **State lives only in memory**, so a page refresh logs the user out of the UI, even though the cookie is still valid. Persisting `user` (or adding a `/me` endpoint) would fix it.

### `src/App.js` (41 lines): routing

`BrowserRouter` + `Routes` maps URLs to components: `/` Home, `/login`, `/studentHome`, `/adminHome`, `/adminPortal`, `/addStudent`, `/postJob`, `/postResults`, `/postResultsHere`, `/checkJobs`, `/seeResults`, `/updateGpa`, plus `/navbarAfterLogin` (a component that doesn't need its own route). There is **no route guard**: protection comes from the pages rendering nothing when `user` is null and from the backend middleware.

### Pages (`src/pages/`)

- **`Home.js` (12):** `<Navbar/>` + `<HomeContent/>`.
- **`HomeContent.js` (29):** landing page. 2–4 import the logo images; 6–11 array of them; 15–27 centered heading, tagline, and a flex row mapping each image to a 150px round `<img>` with `key={index}`.
- **`StudentHome.js` (17):** if `user` exists render `NavbarAfterLogin` + `JobPortalOfStudent`; otherwise nothing.
- **`AdminHome.js` (18):** same, but requires `user.role === 'Admin'` and renders `AdminPortal`.

### `components/Navbar.js` (66) and `Navbar.css` (142): public navbar

- 7: `click` state toggles the mobile menu. 9: `handleClick` flips it.
- 12–21: brand link "V Place" + code icon.
- 22: `<ul>` gets class `active` when the menu is open.
- 23–46: "Home" and "Login" links. The menu closes when one is clicked. `exact` and `activeClassName` were removed in React Router v6, so they're ignored; use the `className` callback form for active styling.
- 48–60: hamburger icon swaps between two SVGs.
- **CSS:** `.navbar` sticky dark bar; `.nav-container` flex layout; `.nav-menu` horizontal list on desktop; the `@media (max-width:960px)` block (line 97 onward) turns the menu into a slide-down panel toggled by `.active`, and shows `.nav-icon`.

### `components/NavbarAfterLogin.js` (119)

- 11–14: gets `user`/`logout` from context.
- 15–38 `logOut`: GET `/user/logout` (clears cookie) → on success toast, wait 1 s, clear context, go to `/`.
- 44: renders only when `user` exists.
- 47: mounts a `<Toaster/>` (so toasts work on any page that has this navbar).
- 53: shows the role next to the brand.
- 56–81: Home link goes to `/studentHome` or `/adminHome` depending on role.
- 82–90: shows the user's name (a link with no `to`, so it's decorative).
- 91–99: Logout.
- 101–111: hamburger as before.

### `components/Icons.js` (53)

Three inline SVG React components that accept `props` (spread on `<svg>`): `CodeIcon` (`</>`), `HamburgetMenuOpen` (three bars, note the typo "Hamburget"), `HamburgetMenuClose` (an X). `fill="currentColor"` makes them inherit text color. The long `d="..."` strings are just vector path data.

### `components/Login.js` (329): login + password reset in one form

**State (15–28):** `formData` (email, password, otp, newPassword, confirmPassword); three "show password" booleans; and four flags driving which step of the flow is on screen: `isResetPassword`, `isOtpSent`, `isOtpVerified`, `passwordChanged`.

- 30–32 `handleInputChange`: generic update using the input's `name`.
- 34–49 `handleSubmit`: checks email, then **dispatches by flow state**: OTP sent → verify OTP; OTP verified → change password; reset mode → request OTP; otherwise → login.
- 51–97 `handleLoginRequest`:
  - 52–55 password required.
  - 57 POST `/user/login` with credentials (so the browser stores the cookie).
  - 64–71 builds `loggedInUser` `{_id,name,email,role,token}`. 72: `login(loggedInUser)` stores it in context.
  - 74–84 after 1 s redirect by role.
  - 86–96 duplicate/else branches show error toasts. The nested `if(success)` at 63 is redundant.
- 99–114 `handleResetPasswordRequest`: POST `sendOtpForResetPswd`; on success `isOtpSent=true`.
- 116–134 `handleOtpSubmit`: POST `verifyOtp`; success flips to "enter new password" mode.
- 136–159 `handlePasswordChange`: client-side check that both passwords match (138), POST `changePassword`, then resets everything back to the login view. (`passwordChanged` is set to `false` on 149 where the comment says true. That whole `passwordChanged` block is dead code.)
- 161–326 JSX:
  - 167: heading text depends on step.
  - 168–178 email input (always shown).
  - 179–202 password input + eye toggle (only in plain login mode).
  - 203–215 OTP input (when OTP sent).
  - 216–261 new + confirm password inputs. **Line 240 contains a typo** (`< label`), and it's valid JSX only because whitespace is allowed after `<`; fix it for readability.
  - 262–281 buttons: "Apply Changes", or Login / Reset Password / Back to Login depending on state.
  - 283–323 the `passwordChanged` login block that never renders.

### `components/LoginForm.css` (77)

`.login-container` centers the card full-height on a grey background; `.login-form` white rounded card (max 400 px); `.input-group` spacing (+ room for the eye icon); `.password-toggle` absolutely positions the eye icon; **global `button {}` rule (line \~51)** styles *every* button in the app blue/full-width once this CSS is loaded, which is why some other buttons look stretched; `.reset-password-button` grey variant; `.button-group` vertical flex with gap.

### `components/AdminPortal.js` (50) + `AdminPortal.css` (25)

Dashboard of Bootstrap cards (`row`/`col-lg-6`), each a coloured `.box` with a heading and a `<Link>` to a feature: Add Student, Post Job, Post Results, Check the Jobs, Update GPA. `postResults` state (7) is unused. CSS: `.box` padding/centering/rounded; `.box1`–`.box4` are pastel red/green/blue/yellow backgrounds.

### `components/AddStudent.js` (88)

- 11–18: form state; **password defaults to `'12345'`**, role fixed to Student, branch defaults `cse`.
- 20–23: generic `handleChange`.
- 25–51 `handleSubmit`: all fields required (27); POST `/user/signup` (the admin's cookie authorises it); on success toast + reset form; on error show the server's message (`error.response?.data?.message`).
- 53–86: Bootstrap form with name, email, password, branch `<select>`, CGPA, and a Back button.

### `components/PostJob.js` (123)

- 11–18: state `{title, Company, Salary, branch[], deadline, cgpa}`. Default deadline is a hard-coded past date (`2024-05-11…`).
- 20–27 `handleCheckboxChange`: add/remove a branch name from the array (checkbox `name` = branch code).
- 29–37: deadline and generic change handlers.
- 39–74 `handleSubmit`: validate all fields incl. at least one branch (42); `moment(deadline).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')` (49). **This keeps the local clock digits and glues a literal `Z` on, so IST deadlines are stored 5 h 30 m late.** Use `new Date(deadline).toISOString()`. Then POST `/job/createJob` with `{...formData, expiretime}`, toast, reset.
- 76–120: inline-styled form: text inputs, `datetime-local` picker, three branch checkboxes.

### `components/PostResults.js` (87): list of all jobs for the admin

- 14–16: fetch on mount. 18–30: GET `/job/getAllJobsByAdmin` → `jobs`.
- 32–39 `handleViewUsers`: stores the chosen id in context (`setJob`) then navigates: results already posted → `/seeResults`; otherwise → `/postResultsHere`.
- 41–60 `handleUploadResults`: posts results directly (with a confirm if none are selected). **It is never called from the UI** (dead code).
- 73–83: one card per job: title, company, applicant count (`job.User.length`), and a button labelled "View Results" or "View Users".

### `components/PostResultsHere.js` (226) + `PostResultsHere.css` (242): post results for one job

- 11–21: `jobId` from context; state for applicants, loading, chosen ids, job name/company, error, uploaded file, modal visibility.
- 24–41 `fetchSelectedUsers` (wrapped in `useCallback` so it's stable for `useEffect`): POST `getStudentsAppliedForJob` with `jobid`; fills the table. `finally` clears `loading`.
- 43–45: run on mount.
- 47–55 `handleCheckboxChange`: toggles an id in `selectedUserIds` unless that user is already `selected` (which, because of the backend `selected` bug, is never true).
- 57–63 `handleSubmit`: opens the confirmation modal.
- 65–98 **Excel path:** `handleFileChange` stores the file; `handleFileUpload` reads it with `FileReader` → `XLSX.read` → first sheet → `sheet_to_json(..., {header:1})` (array of rows). 82: lower-cases headers (`.toLowerCase()` throws if a header cell is a number). 83–89: requires headers `id, name, email, branch`. 91–92: takes the `id` column of every row. 94–95: sets `selectedUserIds` and opens the modal. Ids must be the 24-char Mongo user ids (the same ones in the "Check Jobs" download).
- 101–124 `handleSubmissionConfirmation`: closes the modal and POSTs `{jobid, selectedUserIds}` to `uploadResultsOfJob`; on success toast and go back to `/postResults` after 1.5 s.
- 126–222 JSX: back button; table of applicants with a custom checkbox; submit button; confirmation modal listing the chosen students (filter at 198); and the Excel upload box (217–221).
- **CSS:** table styling (zebra rows at line 21), custom checkbox (`.checkmark` + `:after` tick, lines 26–77), submit/upload/confirm/cancel buttons, `.confirmation-modal` overlay, `.file-upload-container`, and a `@media (max-width:600px)` block (line 93) for phones.

### `components/CheckJobs.js` (127): download applicant lists

- 13–16: load jobs on mount (`getAllJobs` 59–73).
- 18–57 `formatDeadline`: parses the ISO string **with regex** (not a Date, so there's no timezone conversion, which is why it shows the same digits that were stored). Adds ordinal suffix (st/nd/rd/th; 11th–13th would wrongly read "11st/12nd/13rd"), month name, 12-hour clock with am/pm.
- 75–104 `handleDownload`: POST `getStudentsAppliedForJob`; builds a 2-D array `[['Id','Name','Branch','Email'], ...]` (85–89); `aoa_to_sheet` → `book_new` → `book_append_sheet` → `writeFile` downloads `Company_Title_Students.xlsx` (93). Empty list → toast.
- 113–124: a card per job with a download button.

### `components/SeeResults.js` (90)

Reads `jobId` from context, and when it's set (17–21) POSTs `getStudentsSelectedForJob`. Shows company, job name, and a table (name, email, id, branch) of the selected students. `loading` is only turned off in `finally`, so if `jobId` is null (after a refresh) it spins forever.

### `components/UpdateGpa.js` (88)

Excel upload of `id, name, branch, gpa`. 24–67: read file, validate headers (32–38), then a **sequential loop** (41–56) calling `/job/uploadGpa` once per data row (`worksheet[i]` destructured to `[id,name,branch,gpa]`; this assumes the columns are in exactly that order, even though only header *presence* was checked). Shows a toast per failed row, then a success toast (even if some failed) and redirects. A single bulk endpoint would be faster and atomic.

### `components/JobPortalOfStudent.js` (196): the student dashboard

- 10: state holds four lists. 13–16: fetch on mount.
- 19–58: same `formatDeadline` helper (duplicated; move it to a shared `utils` file).
- 61–86 `fetchJobsFromBackend`: GET `getJobs`; maps backend names (`allAvailableJobs`…) to state.
- 89–106 `handleApply`: POST `applyJob` with `{jobID}`; success toast + refetch (so the card moves to Applied); failure toast shows the server message.
- 116–130 **Selected** cards (green "Selected"). 133–147 **Not Selected** cards (red). 150–170 **Available** cards with an Apply button. 173–190 **Applied** cards with "Status: Applied".
- Sections for selected / not-selected render only when non-empty; Available and Applied always render with a "No …" fallback.

---

## 4. End-to-end trace: "student applies, admin posts result"

1. **Login:** `Login.js` → `POST /user/login` → server signs JWT `{email,id,role}` → cookie + JSON → `login()` stores user in context → `navigate('/studentHome')`.
2. **Load jobs:** `JobPortalOfStudent` mounts → `GET /job/getJobs` → `auth` reads cookie → `isStudent` passes → controller builds 4 lists.
3. **Apply:** click → `POST /job/applyJob {jobID}` → job.User gets the student; student.placementCards gets the job → UI refetches → card moves to *Applied*.
4. **Admin downloads applicants:** `CheckJobs` → `POST getStudentsAppliedForJob` → Excel built client-side with SheetJS.
5. **Admin posts results:** `PostResults` → `setJob(id)` → `PostResultsHere` → Excel/checkboxes → `POST uploadResultsOfJob {jobid, selectedUserIds}`:
   - job: `resultsPosted=true`, each selected `User.$.selected=true`;
   - users: `placementCards.$.resultsPosted=true` and `selected=true|false`.
6. **Student refreshes:** `getJobs` now finds `resultsPosted` flags → card appears under *Selected* or *Not Selected*.

---

## 5. Issues worth fixing (highest impact first)

**Security**

1. **`changePassword` doesn't verify the OTP** (`Auth.js` 253–300). Anyone can reset any account's password with just an email. Fix: on `verifyOtp` success return a short-lived signed reset token (or keep a `otpVerified` flag), and require it in `changePassword`, re-checking expiry.
2. **`sendOtpForResetPswd` returns the OTP in the response** (line 196). Remove it.
3. **Hash/OTP leakage:** `uploadGpa` returns the full student document including the password hash. Use `.select('-password -resetPasswordOtp')`.
4. **Default password `12345`** for every new student, with no forced change. Generate a random password and email it, or force a reset at first login.
5. **Cookie isn't `httpOnly`** (login options) and the cookie lives 24 h while the JWT lives 2 h. Add `httpOnly:true` and align the lifetimes.
6. **Server-side checks missing in `applyJob`:** deadline, branch and CGPA aren't re-validated.
7. Add `unique:true` on `User.email` (and normalise to lower case); add rate-limiting on login/OTP.

**Bugs** 8. `signUp` doesn't `await User.create` (Auth.js 30). 9. `const flag` is reassigned (PlacementController 259 / 284 / 297). It would throw if reached. 10. `selected: user.selected` (PlacementController 223 and 346) is always `undefined`; derive it from the job's `User[]` entry. 11. **Deadline timezone bug** in `PostJob.js` line 49 (see above). 12. `verifyOtp` crashes with 500 if no OTP exists (`user.resetPasswordOtp.toString()`). 13. Hard-coded CORS origin (`index.js` line 8) blocks local development; read it from `process.env.FRONTEND_URL`. 14. State lost on refresh (context only), and `SeeResults`/`PostResultsHere` depend on `jobId` from context. Persist `jobId` in the URL (`/postResultsHere/:jobId`). 15. Role guard returns **500** instead of **403**; `auth`'s outer catch returns `success:true` on failure. 16. Ordinal suffix bug for 11/12/13 in `formatDeadline`.

**Code quality** 17. Remove unused imports/deps (`nodemon` in Auth.js, jwt in controller, Redux, Material UI) and dead code (`passwordChanged` block, `handleUploadResults`, `/navbarAfterLogin` route). 18. Extract `formatDeadline` to one shared helper. Replace N+1 `findById` loops in `getJobs`. Wrap the two-sided writes in a Mongoose transaction (or drop the duplicated link and store applications in their own `Application` collection). 19. The global `button {}` rule in `LoginForm.css` leaks into all pages; scope it under `.login-form`. 20. Add `.env.example` files documenting `DATABASE_URL`, `JWT_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `PORT`, `REACT_APP_API_BASE_URL`.

---

## 6. Environment variables you need

| File | Variable | Purpose |
| --- | --- | --- |
| backend `.env` | `DATABASE_URL` | MongoDB connection string |
|  | `JWT_KEY` | secret to sign/verify tokens |
|  | `EMAIL_USER`, `EMAIL_PASS` | Gmail (use an *App Password*) for OTP mail |
|  | `PORT` | optional, defaults to 4000 |
| frontend `.env` | `REACT_APP_API_BASE_URL` | e.g. `http://localhost:4000` |

**Run locally:** `cd backend && npm i && npm run dev`; `cd frontend && npm i && npm start` (change the CORS origin first).

---

## 7. Interview-ready summary

> "A MERN placement portal with role-based access. Admins create students and jobs, download applicant lists as Excel, and publish results by uploading an Excel of selected IDs. Students see jobs filtered by branch, deadline and minimum CGPA, apply with one click, and see their status move from Applied to Selected/Not Selected. Auth uses bcrypt-hashed passwords and JWTs in cookies with `auth`/`isAdmin`/`isStudent` middleware, plus an email-OTP password-reset flow. Data is modelled with two-way references between users and placement cards."