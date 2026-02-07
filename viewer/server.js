
import express from 'express';
import { render } from 'resumed';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Path to resume.json relative to this script
const RESUME_PATH = path.join(__dirname, '..', 'resume.json');

app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to list available themes
app.get('/api/themes', async (req, res) => {
    try {
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const themes = Object.keys(packageJson.dependencies || {})
            .filter(dep => dep.startsWith('jsonresume-theme-'))
            .map(dep => ({
                name: dep.replace('jsonresume-theme-', ''),
                package: dep
            }));
        res.json(themes);
    } catch (error) {
        console.error('Error fetching themes:', error);
        res.status(500).json({ error: 'Failed to fetch themes' });
    }
});

// Endpoint to render resume
app.get('/render', async (req, res) => {
    const themeName = req.query.theme;

    if (!themeName) {
        return res.status(400).send('Theme name is required');
    }

    try {
        // Load resume.json fresh on every request so changes are reflected immediately
        const resumeData = JSON.parse(await fs.readFile(RESUME_PATH, 'utf-8'));

        // Import the theme module dynamically
        const themePackageName = `jsonresume-theme-${themeName}`;
        let themeModule;
        try {
            themeModule = await import(themePackageName);
        } catch (importError) {
            console.error(`Failed to import theme: ${themePackageName}`, importError);
            return res.status(500).send(`
                <h1>Error Loading Theme</h1>
                <p>Could not load theme: <strong>${themePackageName}</strong></p>
                <pre>${importError.message}</pre>
                <p>Ensure the theme is installed correctly (npm install ${themePackageName}) and is compatible with your Node.js version.</p>
             `);
        }

        // Render the resume
        // resumed.render expects (resume, theme)
        // Some themes export 'render' directly, others export default with render.
        // We need to handle this robustly.

        let renderedHtml;
        // Standard "resumed" way
        try {
            renderedHtml = await render(resumeData, themeModule);
        } catch (renderError) {
            // Fallback: some themes export a render function directly?
            // Or maybe themeModule.default?
            console.error(`Render failed with resumed, trying direct call`, renderError);
            if (themeModule.render) {
                renderedHtml = themeModule.render(resumeData);
            } else if (themeModule.default && themeModule.default.render) {
                renderedHtml = themeModule.default.render(resumeData);
            } else {
                throw renderError;
            }
        }

        res.send(renderedHtml);

    } catch (error) {
        console.error('Error rendering resume:', error);
        res.status(500).send(`
            <h1>Render Error</h1>
            <pre>${error.message}</pre>
            <pre>${error.stack}</pre>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
