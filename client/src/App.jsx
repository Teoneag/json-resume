
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button, Group, Select, Loader, Box, Text } from '@mantine/core';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

function App() {
  const [themes, setThemes] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('');
  const [jsonContent, setJsonContent] = useState(null);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/themes').then(r => r.json()),
      fetch('/api/resume').then(r => r.json())
    ]).then(([themesData, resumeData]) => {
      setThemes(themesData);
      if (themesData.length) setCurrentTheme(themesData.find(t => t.name === 'flat')?.name || themesData[0].name);
      setJsonContent(JSON.stringify(resumeData, null, 2));
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
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonContent
      });
      setTimeout(() => setSaving(false), 800);
    } catch { alert('Error saving'); setSaving(false); }
  };

  if (!jsonContent) return <Loader size="xl" m="auto" />;

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={50} minSize={20} style={{ display: 'flex', flexDirection: 'column' }}>
          <Group h={50} px="md" justify="space-between" style={{ borderBottom: '1px solid #e9ecef' }}>
            <Text size="sm" fw={700}>resume.json</Text>
            <Button size="xs" color={saving ? "green" : "dark"} onClick={handleSave}>{saving ? 'Saved' : 'Save'}</Button>
          </Group>
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
        </Panel>

        <PanelResizeHandle style={{ width: 4, background: '#e9ecef', cursor: 'col-resize' }} />

        <Panel defaultSize={50} minSize={20} style={{ display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
          <Group h={50} px="md" justify="space-between" bg="white" style={{ borderBottom: '1px solid #e9ecef' }}>
            <Group gap="xs">
              <Text size="sm" fw={700}>Preview</Text>
              {loading && <Loader size="xs" />}
            </Group>
            <Select size="xs" w={150} data={themes.map(t => t.name)} value={currentTheme} onChange={setCurrentTheme} />
          </Group>
          <div style={{ flex: 1, position: 'relative', width: '100%' }}>
            {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', zIndex: 10 }} />}
            <iframe srcDoc={renderedHtml} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="Preview" />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;
