
import { useState, useEffect, useRef } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { Button, Group, Loader, Box, Text, ActionIcon, Grid, Card } from '@mantine/core';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

function App() {
  const [themes, setThemes] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('');
  const [jsonContent, setJsonContent] = useState(null);
  const [savedContent, setSavedContent] = useState(null);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gridColumns, setGridColumns] = useState(2);
  const [showDiff, setShowDiff] = useState(false);
  const timeoutRef = useRef(null);
  const cardRefs = useRef({});

  useEffect(() => {
    Promise.all([
      fetch('/api/themes').then(r => r.json()),
      fetch('/api/resume').then(r => r.json())
    ]).then(([themesData, resumeData]) => {
      setThemes(themesData);
      const initialContent = JSON.stringify(resumeData, null, 2);
      setJsonContent(initialContent);
      setSavedContent(initialContent);

      const savedTheme = resumeData.meta?.theme?.replace('jsonresume-theme-', '');
      const themeToUse = themesData.find(t => t.name === savedTheme)?.name
        || themesData.find(t => t.name === 'flat')?.name
        || themesData[0]?.name;
      if (themeToUse) {
        setCurrentTheme(themeToUse);
        if (savedTheme && themesData.find(t => t.name === savedTheme)) {
          setGridColumns(1);
          setTimeout(() => {
            cardRefs.current[savedTheme]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!currentTheme || !jsonContent) return;

    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const parsed = JSON.parse(jsonContent);
        const res = await fetch(`/render?theme=${currentTheme}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        setRenderedHtml(await res.text());
      } catch { }
      setLoading(false);
    }, 800);
  }, [jsonContent, currentTheme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.meta) parsed.meta = {};
      parsed.meta.lastModified = new Date().toISOString();

      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });

      const updatedContent = JSON.stringify(parsed, null, 2);
      setJsonContent(updatedContent);
      setSavedContent(updatedContent);

      setTimeout(() => setSaving(false), 800);
    } catch { alert('Error saving'); setSaving(false); }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jsonContent]);

  const handleCardClick = (themeName) => {
    setCurrentTheme(themeName);
    setGridColumns(1);

    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.meta) parsed.meta = {};
      parsed.meta.theme = `jsonresume-theme-${themeName}`;
      setJsonContent(JSON.stringify(parsed, null, 2));
    } catch { }

    setTimeout(() => {
      cardRefs.current[themeName]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100); // TODO find better way
  };

  if (!jsonContent) return <Loader size="xl" m="auto" />;

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={50} minSize={20} style={{ display: 'flex', flexDirection: 'column' }}>
          <Group h={50} px="md" justify="space-between" style={{ borderBottom: '1px solid #e9ecef' }}>
            <Text size="sm" fw={700}>resume.json</Text>
            <Group gap={5}>
              <Button size="xs" color={saving ? "green" : "dark"} onClick={handleSave}>
                {saving ? 'Saved' : (jsonContent !== savedContent ? 'Save *' : 'Save')}
              </Button>
              {jsonContent !== savedContent && (
                <Button size="xs" variant="default" onClick={() => setShowDiff(!showDiff)}>
                  {showDiff ? 'Edit' : 'Diff'}
                </Button>
              )}
            </Group>
          </Group>
          {showDiff ? (
            <DiffEditor
              height="100%"
              language="json"
              original={savedContent}
              modified={jsonContent}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 13,
                readOnly: false,
                renderSideBySide: true
              }}
              onMount={(editor) => {
                const modifiedEditor = editor.getModifiedEditor();
                modifiedEditor.onDidChangeModelContent(() => {
                  setJsonContent(modifiedEditor.getValue());
                });
              }}
            />
          ) : (
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonContent}
              onChange={setJsonContent}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 13,
                scrollbar: { vertical: 'hidden', horizontal: 'hidden' }
              }}
            />
          )}
        </Panel>

        <PanelResizeHandle style={{ width: 4, background: '#e9ecef', cursor: 'col-resize' }} />

        <Panel defaultSize={50} minSize={20} style={{ display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
          <Box bg="white" style={{ borderBottom: '1px solid #e9ecef' }}>
            <Group h={50} px="md" justify="space-between">
              <Group gap="xs">
                <Text size="sm" fw={700}>Preview</Text>
                {loading && <Loader size="xs" />}
              </Group>

              <Group gap={5}>
                <ActionIcon variant="default" size="sm" onClick={() => setGridColumns(Math.max(1, gridColumns - 1))} disabled={gridColumns === 1}>−</ActionIcon>
                <Text size="xs" w={20} ta="center">{gridColumns}</Text>
                <ActionIcon variant="default" size="sm" onClick={() => setGridColumns(Math.min(4, gridColumns + 1))} disabled={gridColumns === 4}>+</ActionIcon>
              </Group>
            </Group>
          </Box>

          <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'auto', padding: 20 }}>
            <Grid>
              {themes.map(theme => (
                <Grid.Col span={12 / gridColumns} key={theme.name}>
                  <Card
                    ref={el => cardRefs.current[theme.name] = el}
                    padding="xs"
                    radius="md"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      border: currentTheme === theme.name && gridColumns === 1 ? '2px solid #228be6' : undefined
                    }}
                    onClick={() => handleCardClick(theme.name)}
                  >
                    <Text size="xs" fw={700} mb={5} ta="center">{theme.name}</Text>
                    <div style={{ width: '100%', aspectRatio: '1024 / 1448', background: 'white', overflow: 'hidden', position: 'relative' }}>
                      <ThemeThumbnail theme={theme.name} json={jsonContent} />
                    </div>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function ThemeThumbnail({ theme, json }) {
  const [html, setHtml] = useState('');
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const fetchRender = async () => {
      try {
        const parsed = JSON.parse(json);
        const res = await fetch(`/render?theme=${theme}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        let content = await res.text();
        content += `<style>body { margin: 0; }</style>`;
        setHtml(content);
      } catch { }
    };
    fetchRender();
  }, [theme, json]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        const scaleX = width / 1024;
        const scaleY = height / 1448;
        if (width > 0 && height > 0) setScale(Math.min(scaleX, scaleY));
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {!html ? (
        <Loader size="xs" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      ) : (
        <iframe
          srcDoc={html}
          style={{
            width: '1024px',
            height: '1448px',
            border: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            position: 'absolute',
            top: 0, left: 0
          }}
          title={theme}
        />
      )}
    </div>
  );
}

export default App;
