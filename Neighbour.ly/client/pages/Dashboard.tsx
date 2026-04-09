import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, ThumbsUp, MapPin, User as UserIcon, Search,
  MoreHorizontal, AlertCircle, CheckCircle, Loader2,
  Map, List, Star, Image as ImageIcon, X, ShieldAlert
} from 'lucide-react';
import { api, userApi } from '@/api';
import { User, Issue, CreateIssueData } from '@/types';

interface DashboardProps {
  user?: User | null;
  onRoleSwitch?: (role: 'citizen' | 'authority') => void;
}

// ── Status helpers ────────────────────────────────────────────────────────────

const statusColor = (s: Issue['status']) => ({
  'Reported': 'bg-red-500/10 text-red-500 border-red-500/20',
  'In Progress': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Fixed': 'bg-green-500/10 text-green-500 border-green-500/20',
}[s] ?? 'bg-muted text-muted-foreground');

const StatusIcon = ({ status }: { status: Issue['status'] }) => ({
  'Reported': <AlertCircle className="h-3 w-3" />,
  'In Progress': <Loader2 className="h-3 w-3" />,
  'Fixed': <CheckCircle className="h-3 w-3" />,
}[status] ?? null);

// ── Map View ──────────────────────────────────────────────────────────────────

function MapView({ issues }: { issues: Issue[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const issuesWithCoords = issues.filter(i => i.latitude && i.longitude);

  useEffect(() => {
    // Dynamically load Leaflet (no npm install needed)
    if (mapLoaded) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || issuesWithCoords.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear previous map
    mapRef.current.innerHTML = '';
    const map = L.map(mapRef.current).setView(
      [issuesWithCoords[0].latitude!, issuesWithCoords[0].longitude!], 13
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const colours: Record<Issue['status'], string> = {
      'Reported': '#ef4444',
      'In Progress': '#f97316',
      'Fixed': '#22c55e',
    };

    issuesWithCoords.forEach(issue => {
      const circle = L.circleMarker([issue.latitude!, issue.longitude!], {
        radius: 10,
        fillColor: colours[issue.status],
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map);

      circle.bindPopup(`
        <strong>${issue.title}</strong><br/>
        <span style="color:${colours[issue.status]}">${issue.status}</span><br/>
        ${issue.category} · ${issue.votes} votes<br/>
        <small>${issue.location}</small>
      `);
    });

    return () => { map.remove(); };
  }, [mapLoaded, issuesWithCoords]);

  if (issuesWithCoords.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Map className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No issues with location coordinates yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            When reporting issues, click "Use My Location" to pin them on the map.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Issue Map
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {issuesWithCoords.length} issue{issuesWithCoords.length !== 1 ? 's' : ''} with location
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-3 text-xs">
          {(['Reported','In Progress','Fixed'] as Issue['status'][]).map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${s === 'Reported' ? 'bg-red-500' : s === 'In Progress' ? 'bg-orange-500' : 'bg-green-500'}`} />
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div ref={mapRef} className="w-full rounded-lg overflow-hidden border" style={{ height: 420 }} />
      </CardContent>
    </Card>
  );
}

// ── Issue Card ────────────────────────────────────────────────────────────────

function IssueCard({ issue, onUpvote, currentUserId }: { issue: Issue; onUpvote: (id: string) => void; currentUserId: string }) {
  const [photoOpen, setPhotoOpen] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col">
      {/* Photo thumbnail */}
      {issue.photos.length > 0 && (
        <div
          className="relative h-40 overflow-hidden rounded-t-lg cursor-pointer"
          onClick={() => setPhotoOpen(true)}
        >
          <img src={issue.photos[0]} alt="Issue" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
          </div>
        </div>
      )}

      <CardContent className="pt-4 flex flex-col flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{issue.title}</h3>
          <Badge className={`shrink-0 text-xs ${statusColor(issue.status)}`}>
            <StatusIcon status={issue.status} />
            <span className="ml-1">{issue.status}</span>
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">{issue.category}</Badge>
          {issue.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[140px]">{issue.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserIcon className="h-3 w-3" />
            <span>{issue.reporter}</span>
            {issue.reporterId === currentUserId && (
              <Badge variant="outline" className="text-xs ml-1">You</Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => onUpvote(issue.id)} className="h-8">
            <ThumbsUp className="h-3 w-3 mr-1" />
            {issue.votes}
          </Button>
        </div>
      </CardContent>

      {/* Photo modal */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{issue.title}</DialogTitle></DialogHeader>
          <img src={issue.photos[0]} alt="Issue" className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Report Issue Form ─────────────────────────────────────────────────────────

function ReportForm({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', category: '', location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    photo: null as File | null,
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm(f => ({ ...f, photo: file }));
    if (file) setPhotoPreview(URL.createObjectURL(file));
    else setPhotoPreview(null);
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        toast({ title: 'Location captured ✓', description: 'Coordinates will be saved with the issue.' });
      },
      () => toast({ title: 'Could not get location', variant: 'destructive' })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.category) {
      toast({ title: 'Fill in all required fields', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateIssueData = {
        title: form.title, description: form.description,
        category: form.category as Issue['category'],
        location: form.location,
        latitude: form.latitude, longitude: form.longitude,
        photo: form.photo, reporterId: user.id,
      };
      const res = await api.createIssue(data);
      if (res.success) {
        toast({ title: 'Issue reported!', description: res.message });
        setForm({ title: '', description: '', category: '', location: '', latitude: undefined, longitude: undefined, photo: null });
        setPhotoPreview(null);
        onSuccess();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to submit issue', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Report New Issue</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description" required />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {['Road','Streetlight','Garbage','Water','Pollution','Other'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description" rows={3} required />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Street address or landmark" className="flex-1" />
              <Button type="button" variant="outline" onClick={getLocation} className="shrink-0">
                <MapPin className="h-4 w-4 mr-1" />
                {form.latitude ? '✓ Pinned' : 'Pin'}
              </Button>
            </div>
            {form.latitude && (
              <p className="text-xs text-muted-foreground">
                📍 {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            <Input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handlePhoto} />
            {photoPreview && (
              <div className="relative mt-2 w-40">
                <img src={photoPreview} alt="Preview" className="rounded-lg border object-cover w-40 h-28" />
                <button type="button" onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo: null })); }}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Plus className="mr-2 h-4 w-4" />Submit Issue (+5 ⭐)</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Filters Bar ───────────────────────────────────────────────────────────────

function FiltersBar({ filters, onChange }: {
  filters: { category: string; status: string; search: string };
  onChange: (f: Partial<typeof filters>) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search issues..." value={filters.search}
              onChange={e => onChange({ search: e.target.value })} />
          </div>
          <Select value={filters.category} onValueChange={v => onChange({ category: v })}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {['Road','Streetlight','Garbage','Water','Pollution','Other'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => onChange({ status: v })}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Reported">Reported</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Citizen View ──────────────────────────────────────────────────────────────

function CitizenView({ user, issues, isLoading, filters, onFiltersChange, onUpvote, onIssueCreated }: {
  user: User; issues: Issue[]; isLoading: boolean;
  filters: { category: string; status: string; search: string };
  onFiltersChange: (f: any) => void;
  onUpvote: (id: string) => void;
  onIssueCreated: () => void;
}) {
  const [tab, setTab] = useState<'all' | 'mine' | 'map'>('all');

  const displayIssues = tab === 'mine'
    ? issues.filter(i => i.reporterId === user.id)
    : issues;

  return (
    <div className="space-y-6">
      <ReportForm user={user} onSuccess={onIssueCreated} />
      <FiltersBar filters={filters} onChange={onFiltersChange} />

      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all"><List className="h-4 w-4 mr-1" />All Issues</TabsTrigger>
          <TabsTrigger value="mine"><Star className="h-4 w-4 mr-1" />My Issues</TabsTrigger>
          <TabsTrigger value="map"><Map className="h-4 w-4 mr-1" />Map</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'map' ? (
        <MapView issues={issues} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="pt-6 h-48" /></Card>
            ))
          ) : displayIssues.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              {tab === 'mine' ? "You haven't reported any issues yet." : "No issues found."}
            </div>
          ) : (
            displayIssues.map(issue => (
              <IssueCard key={issue.id} issue={issue} onUpvote={onUpvote} currentUserId={user.id} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Authority View ────────────────────────────────────────────────────────────

function AuthorityView({ user, issues, isLoading, filters, onFiltersChange, onStatusUpdate }: {
  user: User; issues: Issue[]; isLoading: boolean;
  filters: { category: string; status: string; search: string };
  onFiltersChange: (f: any) => void;
  onStatusUpdate: (id: string, status: Issue['status']) => void;
}) {
  const [tab, setTab] = useState<'list' | 'map'>('list');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <ShieldAlert className="h-4 w-4 text-orange-500" />
        <span className="text-sm text-orange-600">You are viewing as an Authority. You can update issue statuses.</span>
      </div>

      <FiltersBar filters={filters} onChange={onFiltersChange} />

      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="list"><List className="h-4 w-4 mr-1" />Issues Table</TabsTrigger>
          <TabsTrigger value="map"><Map className="h-4 w-4 mr-1" />Map</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'map' ? (
        <MapView issues={issues} />
      ) : (
        <Card>
          <CardHeader><CardTitle>Issues Management</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No issues found</TableCell>
                    </TableRow>
                  ) : issues.map(issue => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-mono text-xs">#{issue.id.slice(0, 8)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          {issue.photos.length > 0 && (
                            <img src={issue.photos[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                          )}
                          <span className="truncate">{issue.title}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{issue.category}</Badge></TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-1">
                          {issue.latitude && <MapPin className="h-3 w-3 text-primary shrink-0" />}
                          <span className="truncate">{issue.location || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{issue.reporter}</TableCell>
                      <TableCell>{issue.votes}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(issue.status)}>
                          <StatusIcon status={issue.status} />
                          <span className="ml-1">{issue.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(['Reported', 'In Progress', 'Fixed'] as Issue['status'][]).map(s => (
                              <DropdownMenuItem key={s} onClick={() => onStatusUpdate(issue.id, s)} disabled={issue.status === s}>
                                Mark as {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Dashboard (main) ──────────────────────────────────────────────────────────

export function Dashboard({ user, onRoleSwitch }: DashboardProps) {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ category: 'all', status: 'all', search: '' });

  if (!user) return <Navigate to="/login" replace />;

  const currentRole = (searchParams.get('role') as 'citizen' | 'authority') || user.role;

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getIssues({
        category: filters.category === 'all' ? undefined : filters.category as Issue['category'],
        status: filters.status === 'all' ? undefined : filters.status as Issue['status'],
        search: filters.search || undefined,
      });
      if (res.success) setIssues(res.data.items);
    } catch {
      toast({ title: 'Error', description: 'Failed to load issues', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  const handleUpvote = async (issueId: string) => {
    const res = await api.upvoteIssue(issueId, user.id);
    if (res.success) { toast({ title: 'Upvoted!', description: res.message }); loadIssues(); }
    else toast({ title: 'Error', description: res.message, variant: 'destructive' });
  };

  const handleStatusUpdate = async (issueId: string, newStatus: Issue['status']) => {
    const res = await api.updateIssueStatus(issueId, { status: newStatus, byUserId: user.id });
    if (res.success) { toast({ title: 'Status updated', description: res.message }); loadIssues(); }
    else toast({ title: 'Error', description: res.message, variant: 'destructive' });
  };

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {currentRole === 'citizen' ? 'Citizen Dashboard' : 'Authority Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {currentRole === 'citizen'
            ? 'Report issues and help improve your community'
            : 'Manage and resolve community issues'}
        </p>
      </div>

      {currentRole === 'citizen' ? (
        <CitizenView
          user={user} issues={issues} isLoading={isLoading} filters={filters}
          onFiltersChange={handleFiltersChange} onUpvote={handleUpvote} onIssueCreated={loadIssues}
        />
      ) : (
        <AuthorityView
          user={user} issues={issues} isLoading={isLoading} filters={filters}
          onFiltersChange={handleFiltersChange} onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

export default Dashboard;
