
# JSON Resume Viewer

This project allows you to edit and preview your resume using various JSON Resume themes instantly.

## 🚀 Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start the Viewer**
    ```bash
    npm start
    ```

3.  **View & Edit**
    -   Open **[http://localhost:3000](http://localhost:3000)** in your browser.
    -   Edit `resume.json` in your code editor.
    -   Refresh the browser or switch themes to see your changes instantly.

## 🎨 Themes

To add more themes, install them via npm:
```bash
npm install jsonresume-theme-<theme-name>
```
They will automatically appear in the dropdown menu after a page refresh.

## 📤 Export (Optional)

To export your resume to PDF using a specific theme:
```bash
npx resumed export resume.pdf --theme jsonresume-theme-<name>
```
