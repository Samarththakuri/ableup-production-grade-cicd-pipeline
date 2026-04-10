import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  description?: string;
  location: string;
  salary: string;
  accessibility: string;
  type: string;
  hours: string;
  remote?: boolean;
}

const mockJobs: Job[] = [
  { id: "1", title: "Data Entry Operator", location: "Remote", salary: "₹15,000 - ₹25,000", accessibility: "Screen reader compatible", type: "Visual Impairment", hours: "Full-time" },
  { id: "2", title: "Customer Support Executive", location: "Mumbai", salary: "₹20,000 - ₹30,000", accessibility: "Wheelchair accessible", type: "Locomotor Disability", hours: "Full-time" },
  { id: "3", title: "Content Writer", location: "Remote", salary: "₹18,000 - ₹28,000", accessibility: "Flexible hours", type: "Any", hours: "Part-time" },
  { id: "4", title: "Web Developer", location: "Bangalore", salary: "₹35,000 - ₹55,000", accessibility: "Remote option, assistive tech", type: "Visual Impairment", hours: "Full-time" },
  { id: "5", title: "Graphic Designer", location: "Delhi", salary: "₹25,000 - ₹40,000", accessibility: "Wheelchair accessible, flexi hours", type: "Locomotor Disability", hours: "Flexi-time" },
  { id: "6", title: "Accountant", location: "Remote", salary: "₹30,000 - ₹45,000", accessibility: "Screen reader, voice commands", type: "Visual Impairment", hours: "Full-time" },
];

const JobSearchPage = () => {
  const [keyword, setKeyword] = useState("");
  const [disabilityFilter, setDisabilityFilter] = useState("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("q", keyword);
      if (disabilityFilter !== "all") params.set("disability", disabilityFilter);
      const data = await api<{ jobs: any[] }>(`/jobs/search?${params.toString()}`);
      const mapped: Job[] = data.jobs.map((j: any) => ({
        id: j._id || j.id,
        title: j.title,
        description: j.description,
        location: j.location || (j.remote ? "Remote" : "On-site"),
        salary: j.salaryMin && j.salaryMax ? `₹${j.salaryMin.toLocaleString()} - ₹${j.salaryMax.toLocaleString()}` : "Not specified",
        accessibility: (j.accessibilityFeatures || []).join(", ") || "Contact employer",
        type: (j.disabilityEligible || []).join(", ") || "Any",
        hours: j.workHours || "Full-time",
        remote: j.remote,
      }));
      setJobs(mapped);
    } catch {
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      const data = await api<{ savedJobs: any[] }>("/candidate/saved");
      setSavedJobIds(new Set(data.savedJobs.map((j: any) => j._id || j.id)));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchJobs();
    if (user?.role === "candidate") fetchSaved();
  }, []);

  const handleSearch = () => fetchJobs();

  const handleSave = async (jobId: string) => {
    try {
      const data = await api<{ saved: boolean }>(`/candidate/save/${jobId}`, { method: "POST" });
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        data.saved ? next.add(jobId) : next.delete(jobId);
        return next;
      });
      toast({ title: data.saved ? "Job saved" : "Job unsaved" });
    } catch {
      toast({ title: "Login to save jobs", variant: "destructive" });
    }
  };

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      await api(`/candidate/apply/${jobId}`, { method: "POST" });
      toast({ title: "Application submitted!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to apply", variant: "destructive" });
    } finally {
      setApplyingId(null);
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesKeyword = !keyword || j.title.toLowerCase().includes(keyword.toLowerCase());
    const matchesDisability = disabilityFilter === "all" || j.type.includes(disabilityFilter) || j.type === "Any";
    return matchesKeyword && matchesDisability;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <h1 className="mb-6 text-2xl font-bold text-foreground">Browse Inclusive Jobs</h1>

          <div className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label htmlFor="search-keyword" className="text-sm font-medium text-foreground">Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="search-keyword" className="pl-9" placeholder="Job title or company..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              </div>
            </div>
            <div className="min-w-[200px] space-y-1">
              <label htmlFor="disability-filter" className="text-sm font-medium text-foreground">Disability Type</label>
              <Select value={disabilityFilter} onValueChange={setDisabilityFilter}>
                <SelectTrigger id="disability-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Visual Impairment">Visual Impairment</SelectItem>
                  <SelectItem value="Hearing Impairment">Hearing Impairment</SelectItem>
                  <SelectItem value="Locomotor Disability">Locomotor Disability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">{filtered.length} job{filtered.length !== 1 ? "s" : ""} found</p>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((job) => (
                <Card key={job.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-semibold text-foreground">{job.title}</h2>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-accent"
                        aria-label={`Save ${job.title}`}
                        onClick={() => handleSave(job.id)}
                      >
                        {savedJobIds.has(job.id) ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground"><MapPin className="h-3 w-3" />{job.location}</span>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{job.salary}</span>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{job.hours}</span>
                    </div>
                    <p className="mt-2 text-xs text-primary">♿ {job.accessibility}</p>
                    <Button
                      className="mt-4 w-full" size="sm"
                      disabled={user?.verificationStatus !== "approved" || applyingId === job.id}
                      onClick={() => handleApply(job.id)}
                    >
                      {applyingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : user?.verificationStatus === "approved" ? "Apply Now" : "Verify to Apply"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JobSearchPage;
