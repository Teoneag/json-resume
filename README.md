
# JSON Resume Editor

Local visualization tool for [JSON Resume](https://jsonresume.org/).

## Getting Started

1.  Install & Run

```bash
npm install && npm start
```
Opens editor at `http://localhost:5173`.

2.  Add Themes:

```bash
npm install jsonresume-theme-<name>
```
(Restart server to load new themes).

## Usage
*   **Edit:** Modify `resume.json` on the left.
*   **Preview:** See changes live on the right.
*   **Export:** Use browser's **Print -> Save as PDF**.

## Structure
*   `resume.json`: Your data.
*   `server/`: Backend API & Renderer.
*   `client/`: React Frontend (Port 5173).
