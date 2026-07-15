import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, MapPin, Clock, Flame, CheckCircle, LogIn } from "lucide-react";
import { toast } from "sonner";

const jobCategories = ["All", "Plumbing", "Tech", "Cleaning", "Delivery", "Electrical", "Fashion", "Photography", "HVAC"];

export default function Jobs() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeCat, setActiveCat] = useState("All");
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);
  const [cover, setCover] = useState("");

  const { data: jobs } = trpc.job.list.useQuery({ category: activeCat === "All" ? undefined : activeCat });

  const applyMutation = trpc.job.applyToJob.useMutation({
    onSuccess: () => {
      setApplied(true);
      toast.success("Application submitted!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit application. Please try again.");
    },
  });

  const selectedJobData = jobs?.find((j) => j.id === selectedJob);

  const handleApply = () => {
    if (!selectedJob) return;
    applyMutation.mutate({ jobId: selectedJob, coverLetter: cover.trim() || undefined });
  };

  if (selectedJob && selectedJobData) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={() => { setSelectedJob(null); setApplied(false); setCover(""); }} className="text-peza-brown mb-4 flex items-center gap-1 text-sm font-semibold">
          ← Back to jobs
        </button>

        {/* Job Header */}
        <div className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-2xl p-5 text-white">
          <h1 className="text-xl font-bold">{selectedJobData.title}</h1>
          <p className="text-white/70 text-sm mt-1">{selectedJobData.company}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-peza-gold/20 text-peza-gold text-xs font-semibold px-3 py-1 rounded-full">{selectedJobData.category}</span>
            <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {selectedJobData.location}
            </span>
            <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> {selectedJobData.type}
            </span>
          </div>
        </div>

        {/* Salary */}
        <div className="bg-white rounded-xl border border-peza-cream-dark p-5 mt-4">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Salary Range</p>
          <p className="text-2xl font-extrabold text-peza-green mt-1">{selectedJobData.salary}</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-peza-cream-dark p-5 mt-3">
          <h3 className="text-sm font-bold text-peza-brown mb-2">Job Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{selectedJobData.description}</p>
        </div>

        {/* Requirements */}
        {selectedJobData.requirements && (
          <div className="bg-white rounded-xl border border-peza-cream-dark p-5 mt-3">
            <h3 className="text-sm font-bold text-peza-brown mb-2">Requirements</h3>
            <ul className="space-y-2">
              {selectedJobData.requirements.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-peza-green flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply Form */}
        {!applied ? (
          !isAuthenticated ? (
            <div className="bg-white rounded-xl border border-peza-cream-dark p-6 mt-3 mb-8 text-center">
              <LogIn className="w-8 h-8 text-peza-orange mx-auto mb-2" />
              <h3 className="text-sm font-bold text-peza-brown mb-1">Sign in to apply</h3>
              <p className="text-xs text-gray-500 mb-4">You need an account to submit a job application.</p>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2.5 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-peza-cream-dark p-5 mt-3 mb-8">
              <h3 className="text-sm font-bold text-peza-brown mb-3">Apply for this Job</h3>
              <textarea
                placeholder="Write a brief cover letter..."
                className="w-full border-2 border-peza-cream-dark rounded-xl p-3 text-sm outline-none focus:border-peza-orange transition-colors resize-none h-24"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                disabled={applyMutation.isPending}
              />
              <button
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="w-full mt-3 py-3 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors disabled:opacity-50"
              >
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          )
        ) : (
          <div className="bg-green-50 rounded-xl p-6 text-center mt-3 mb-8">
            <CheckCircle className="w-10 h-10 text-peza-green mx-auto mb-2" />
            <h3 className="text-base font-bold text-peza-green">Application Submitted!</h3>
            <p className="text-sm text-gray-600 mt-1">The employer will contact you soon.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-6 h-6 text-peza-brown" />
        <h1 className="text-2xl font-extrabold text-peza-brown">Find Work in Africa</h1>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {jobCategories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${activeCat === c ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">{jobs?.length || 0} opportunities</p>

      {/* Job Listings */}
      {jobs && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className="bg-white rounded-xl border border-peza-cream-dark p-4 cursor-pointer hover:shadow-peza transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-peza-brown flex-1">{job.title}</h3>
                {job.urgent && (
                  <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ml-2">
                    <Flame className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{job.company}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">{job.category}</span>
                <span className="bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">{job.type}</span>
                <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> {job.location}
                </span>
              </div>
              <p className="text-sm font-bold text-peza-green mt-2">{job.salary}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-peza-brown">No jobs found</h3>
        </div>
      )}
    </div>
  );
}
