
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
        try { res.send(await render(req.body, theme)); }
        catch { res.send((theme.render || theme.default?.render)(req.body)); }
    } catch (e) { res.status(500).send(e.message); }
});

app.listen(PORT, () => console.log(`API at http://localhost:${PORT}`));
