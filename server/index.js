
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { render, pdf } from 'resumed';

const app = express();
const PORT = 3001;
const RESUME_PATH = path.resolve('resume.json');

app.use(express.json({ limit: '50mb' }));

async function getRenderedHtml(resume, themeName) {
    const pkgName = `jsonresume-theme-${themeName}`;
    const theme = await import(pkgName);

    try {
        return await render(resume, theme);
    } catch (e1) {
        if (theme.render) return await theme.render(resume);
        if (theme.default?.render) return await theme.default.render(resume);
        if (typeof theme.default === 'function') return await theme.default(resume);
        throw new Error('No render method found');
    }
}

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
    try {
        const html = await getRenderedHtml(req.body, req.query.theme);
        res.send(html);
    } catch (e) {
        console.error(`Render failed:`, e.message);
        res.status(500).send(`<h1>Render Error</h1><p>${e.message}</p>`);
    }
});

app.post('/api/export-pdf', async (req, res) => {
    try {
        const themeName = req.query.theme;
        const html = await getRenderedHtml(req.body, themeName);
        const theme = await import(`jsonresume-theme-${themeName}`);

        const pdfBuffer = await pdf(html, req.body, theme);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=resume-${themeName}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    } catch (e) {
        console.error(`PDF Export failed:`, e.message);
        res.status(500).send('PDF Export failed');
    }
});

app.listen(PORT, () => console.log(`API at http://localhost:${PORT}`));
