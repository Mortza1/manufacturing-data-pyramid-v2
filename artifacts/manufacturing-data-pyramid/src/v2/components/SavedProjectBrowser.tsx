import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Archive, Check, ChevronDown, FolderOpen, LoaderCircle, X } from 'lucide-react';
import { useV2Store, type V2LoadedProjectContext } from '../store';
import type { V2Case } from '../types';

type SavedUser = {
  id: string;
  displayName: string;
};

type SavedProject = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  currentVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type SavedVersion = {
  id: string;
  projectId: string;
  versionNumber: number;
  snapshotSchemaVersion: number;
  versionNote: string;
  createdAt: string;
  creatorUserId: string;
};

type BrowserState =
  | { kind: 'idle' }
  | { kind: 'loading-users' }
  | { kind: 'loading-projects' }
  | { kind: 'loading-versions' }
  | { kind: 'opening' }
  | { kind: 'error'; message: string };

type SavedSnapshot = {
  format: 'manufacturing-data-pyramid-v2';
  schemaVersion: 1;
  case: V2Case;
};

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function validateSavedSnapshot(value: unknown): { snapshot?: SavedSnapshot; error?: string } {
  if (!value || typeof value !== 'object') return { error: 'The saved snapshot is empty.' };
  const candidate = value as Partial<SavedSnapshot>;
  if (candidate.format !== 'manufacturing-data-pyramid-v2' || candidate.schemaVersion !== 1) {
    return { error: 'This saved version uses an unsupported snapshot format or schema version.' };
  }
  const projectCase = candidate.case;
  if (!projectCase || typeof projectCase !== 'object') return { error: 'The saved snapshot has no valid case.' };
  if (
    !Array.isArray(projectCase.levels) ||
    !Array.isArray(projectCase.sectors) ||
    !projectCase.grid ||
    !projectCase.overlays ||
    !Array.isArray(projectCase.overlays.data) ||
    !Array.isArray(projectCase.overlays.models) ||
    !Array.isArray(projectCase.overlays.agents) ||
    !Array.isArray(projectCase.overlays.decisions) ||
    !Array.isArray(projectCase.overlays.loops) ||
    !Array.isArray(projectCase.overlays.connectivity)
  ) {
    return { error: 'The saved snapshot is missing its structure or overlays.' };
  }
  const { width, height } = projectCase.grid;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return { error: 'The saved snapshot has an invalid canonical grid.' };
  }
  const levelIds = new Set<string>();
  for (const level of projectCase.levels) {
    if (!level || typeof level.id !== 'string' || levelIds.has(level.id)) return { error: 'The saved snapshot has invalid or duplicate level IDs.' };
    levelIds.add(level.id);
  }
  const sectorIds = new Set<string>();
  for (const sector of projectCase.sectors) {
    if (!sector || typeof sector.id !== 'string' || sectorIds.has(sector.id)) return { error: 'The saved snapshot has invalid or duplicate sector IDs.' };
    sectorIds.add(sector.id);
  }
  const overlays = projectCase.overlays;
  const objectIds = new Set<string>();
  const objects = [...overlays.data, ...overlays.models, ...overlays.agents, ...overlays.decisions];
  for (const object of objects) {
    if (!object || typeof object.id !== 'string' || objectIds.has(object.id)) return { error: 'The saved snapshot has invalid or duplicate object IDs.' };
    if (!levelIds.has(object.level_id) || !sectorIds.has(object.sector_id)) return { error: `Object ${object.id} references a missing level or sector.` };
    if (!Number.isInteger(object.grid_x) || !Number.isInteger(object.grid_y) || object.grid_x < 0 || object.grid_y < 0 || object.grid_x >= width || object.grid_y >= height) {
      return { error: `Object ${object.id} is outside the canonical grid.` };
    }
    objectIds.add(object.id);
  }
  const loopIds = new Set<string>();
  for (const loop of overlays.loops) {
    if (!loop || typeof loop.id !== 'string' || loopIds.has(loop.id)) return { error: 'The saved snapshot has invalid or duplicate loop IDs.' };
    loopIds.add(loop.id);
  }
  const sequenceKeys = new Set<string>();
  for (const segment of overlays.connectivity) {
    const sequenceKey = `${segment.loop_id}:${segment.sequence}`;
    if (!loopIds.has(segment.loop_id) || !objectIds.has(segment.source_object_id) || !objectIds.has(segment.target_object_id)) {
      return { error: 'A saved connection references a missing loop or object.' };
    }
    if (sequenceKeys.has(sequenceKey)) return { error: 'A saved loop contains duplicate segment sequence numbers.' };
    sequenceKeys.add(sequenceKey);
  }
  return { snapshot: candidate as SavedSnapshot };
}

function formatSavedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}

export function SavedProjectBrowser() {
  const isOpen = useV2Store((state) => state.isProjectBrowserOpen);
  const setOpen = useV2Store((state) => state.setProjectBrowserOpen);
  const hydrateSavedCase = useV2Store((state) => state.hydrateSavedCase);
  const [users, setUsers] = useState<SavedUser[]>([]);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [userId, setUserId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [state, setState] = useState<BrowserState>({ kind: 'idle' });

  useEffect(() => {
    if (!isOpen) return;
    setState({ kind: 'loading-users' });
    requestJson<{ users: SavedUser[] }>('/api/users')
      .then((result) => {
        setUsers(result.users);
        setState({ kind: 'idle' });
      })
      .catch((error) => setState({ kind: 'error', message: error instanceof Error ? error.message : 'Users could not be loaded.' }));
  }, [isOpen]);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setProjectId('');
      setVersions([]);
      setVersionId('');
      return;
    }
    setState({ kind: 'loading-projects' });
    requestJson<{ projects: SavedProject[] }>(`/api/users/${userId}/projects`)
      .then((result) => {
        setProjects(result.projects);
        setProjectId('');
        setVersions([]);
        setVersionId('');
        setState({ kind: 'idle' });
      })
      .catch((error) => setState({ kind: 'error', message: error instanceof Error ? error.message : 'Projects could not be loaded.' }));
  }, [userId]);

  useEffect(() => {
    if (!projectId) {
      setVersions([]);
      setVersionId('');
      return;
    }
    setState({ kind: 'loading-versions' });
    requestJson<{ versions: SavedVersion[] }>(`/api/projects/${projectId}/versions`)
      .then((result) => {
        setVersions(result.versions);
        setVersionId('');
        setState({ kind: 'idle' });
      })
      .catch((error) => setState({ kind: 'error', message: error instanceof Error ? error.message : 'Versions could not be loaded.' }));
  }, [projectId]);

  const selectedUser = users.find((user) => user.id === userId);
  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedVersion = versions.find((version) => version.id === versionId);
  const isBusy = ['loading-users', 'loading-projects', 'loading-versions', 'opening'].includes(state.kind);
  const latestVersionNumber = useMemo(() => Math.max(0, ...versions.map((version) => version.versionNumber)), [versions]);

  if (!isOpen) return null;

  const close = () => {
    if (state.kind !== 'opening') setOpen(false);
  };

  const openVersion = async () => {
    if (!selectedUser || !selectedProject || !selectedVersion) {
      setState({ kind: 'error', message: 'Choose a user, project, and exact version first.' });
      return;
    }
    const confirmed = window.confirm('Open saved version?\n\nOpening this version will replace the current Walkthrough working draft. Saved database versions will not be affected.');
    if (!confirmed) return;
    setState({ kind: 'opening' });
    try {
      const result = await requestJson<{ project: SavedProject; version: SavedVersion & { snapshot: unknown } }>(`/api/projects/${selectedProject.id}/versions/${selectedVersion.id}`);
      const checked = validateSavedSnapshot(result.version.snapshot);
      if (!checked.snapshot) throw new Error(checked.error || 'The saved snapshot failed validation.');
      const context: V2LoadedProjectContext = {
        userId: selectedUser.id,
        userName: selectedUser.displayName,
        projectId: result.project.id,
        projectName: result.project.name,
        projectDescription: result.project.description,
        sourceVersionId: result.version.id,
        sourceVersionNumber: result.version.versionNumber,
        latestVersionNumber: Math.max(latestVersionNumber, result.version.versionNumber),
      };
      hydrateSavedCase(checked.snapshot.case, context);
      setOpen(false);
    } catch (error) {
      setState({ kind: 'error', message: error instanceof Error ? error.message : 'The saved version could not be opened.' });
    }
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-start justify-center bg-black/65 p-4 backdrop-blur-sm md:p-10">
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#07111c]/[.98] shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-cyan-300/15 bg-cyan-300/10 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200"><FolderOpen size={19} /></div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/75">Saved projects</p>
              <h2 className="mt-1 text-xl font-bold text-cyan-50">Open Project</h2>
              <p className="mt-1 text-xs text-cyan-100/65">Choose a named user, project, and exact immutable version.</p>
            </div>
          </div>
          <button onClick={close} aria-label="Close project browser" className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"><X size={15} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <BrowserSelect label="User" value={userId} onChange={setUserId} disabled={state.kind === 'loading-users'} placeholder={state.kind === 'loading-users' ? 'Loading users…' : 'Select user'} options={users.map((user) => ({ value: user.id, label: user.displayName }))} />
              <BrowserSelect label="Project" value={projectId} onChange={setProjectId} disabled={!userId || state.kind === 'loading-projects'} placeholder={state.kind === 'loading-projects' ? 'Loading projects…' : 'Select project'} options={projects.map((project) => ({ value: project.id, label: project.name }))} />
              <BrowserSelect label="Version" value={versionId} onChange={setVersionId} disabled={!projectId || state.kind === 'loading-versions'} placeholder={state.kind === 'loading-versions' ? 'Loading versions…' : 'Select version'} options={versions.map((version) => ({ value: version.id, label: `v${version.versionNumber}${version.versionNote ? ` · ${version.versionNote}` : ''}` }))} />
            </div>
            {selectedProject && <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3"><Archive size={16} className="mt-0.5 shrink-0 text-cyan-200/80" /><div><p className="text-sm font-bold text-foreground">{selectedProject.name}</p><p className="mt-1 text-xs text-muted-foreground">{selectedProject.description || 'No project description.'}</p><p className="mt-2 text-[10px] text-cyan-100/60">Updated {formatSavedDate(selectedProject.updatedAt)} · {versions.length} immutable version{versions.length === 1 ? '' : 's'}</p></div></div>
            </div>}
            {selectedVersion && <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4">
              <div className="flex items-start gap-3"><Check size={16} className="mt-0.5 shrink-0 text-emerald-300" /><div><p className="text-sm font-bold text-emerald-50">Exact version selected: v{selectedVersion.versionNumber}</p><p className="mt-1 text-xs text-emerald-100/70">{selectedVersion.versionNote || 'No version note.'}</p><p className="mt-1 text-[10px] text-emerald-100/55">Created {formatSavedDate(selectedVersion.createdAt)}</p></div></div>
            </div>}
            {state.kind === 'error' && <div className="flex items-start gap-2 rounded border border-rose-300/25 bg-rose-400/10 p-3 text-xs text-rose-100"><AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{state.message} The current working draft has not been replaced.</span></div>}
            {!isBusy && users.length === 0 && <p className="rounded border border-white/10 bg-black/20 p-4 text-xs text-muted-foreground">No named users have saved projects yet.</p>}
          </div>
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#07111c] px-5 py-3">
          <p className="text-[10px] text-muted-foreground">{selectedVersion ? 'Opening this version replaces only the local working draft.' : 'Select an exact version to continue.'}</p>
          <button onClick={openVersion} disabled={isBusy || !selectedVersion} className="flex items-center gap-2 rounded bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
            {state.kind === 'opening' ? <LoaderCircle size={14} className="animate-spin" /> : <FolderOpen size={14} />}
            {state.kind === 'opening' ? 'Opening…' : 'Open Version'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function BrowserSelect({ label, value, onChange, options, disabled, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; disabled: boolean; placeholder: string }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}
      <div className="relative mt-1">
        <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full appearance-none rounded border border-white/10 bg-black/35 px-2.5 py-2 pr-8 text-xs text-foreground outline-none focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50">
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    </label>
  );
}