
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { render } from 'resumed';

const app = express();
const PORT = 3001;
const RESUME_PATH = path.resolve('resume.json');

app.use(express.json({ limit: '50mb' }));

app.get('/api/themes', async (req, res) => {
    try {
        const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
        const list = Object.keys(pkg.dependencies).filter(d => d.startsWith('jsonresume-theme-'));
        res.json(list.map(d => ({ name: d.replace('jsonresume-theme-', '') })));
    } catch { res.json([]) }
});

app.get('/api/resume', async (req, res) => {
    try { res.json(JSON.parse(await fs.readFile(RESUME_PATH, 'utf-8'))); }
    catch { res.status(500).send('Error'); }
});

app.post('/api/save', async (req, res) => {
    try {
        await fs.writeFile(RESUME_PATH, JSON.stringify(req.body, null, 2));
        res.send('Saved');
    } catch { res.status(500).send('Error'); }
});

app.post('/render', async (req, res) => {
    const pkgName = `jsonresume-theme-${req.query.theme}`;
    try {
        const theme = await import(pkgName);

        // Try multiple render strategies
        try {
            // Strategy 1: Use resumed's render
            res.send(await render(req.body, theme));
        } catch (e1) {
            try {
                // Strategy 2: Direct theme.render
                if (theme.render) {
                    res.send(await theme.render(req.body));
                } else if (theme.default?.render) {
                    res.send(await theme.default.render(req.body));
                } else if (typeof theme.default === 'function') {
                    // Strategy 3: Default export is the render function
                    res.send(await theme.default(req.body));
                } else {
                    throw new Error('No render method found');
                }
            } catch (e2) {
                console.error(`Render failed for ${pkgName}:`, e2.message);
                res.status(500).send(`<h1>Theme Error</h1><p>${e2.message}</p>`);
            }
        }
    } catch (e) {
        console.error(`Import failed for ${pkgName}:`, e.message);
        res.status(500).send(`<h1>Theme Not Found</h1><p>${e.message}</p>`);
    }
});

app.listen(PORT, () => console.log(`API at http://localhost:${PORT}`));
