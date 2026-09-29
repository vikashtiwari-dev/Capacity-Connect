import React from "react";
import { Link } from "react-router-dom";
import { Award, QrCode, Download, Share2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { CertificateModal } from "../../components/assessment/CertificateModal";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useCoursesStore } from "../../store/coursesStore";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export const Certificates: React.FC = () => {
  const { certificates } = useCoursesStore();
  const { currentUser } = useAuthStore();
  const { addToast } = useAppStore();
  const [selectedCert, setSelectedCert] = React.useState<any>(null);

  // Strictly filter certificates belonging to current student
  const certs = certificates.filter((c) => c.traineeId === currentUser?.id);

  return (
    <DashboardLayout
      pageTitle="Verified Competency Certificates"
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Certificates" }]}
    >
      <div className="space-y-6">
        <div className="glass-panel p-5 border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-r from-[#0c0f1c] via-[#101426] to-[#0a0d16]">
          <div className="max-w-2xl space-y-1">
            <span className="badge-blue text-[9px] uppercase font-bold tracking-wider">
              Earned Micro-Credentials & Diplomas
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Verified Competency Certificates
            </h2>
            <p className="text-xs text-slate-300">
              Cryptographically verifiable credentials signed on the organizational ledger with dynamic QR hashes.
            </p>
          </div>
        </div>

        {certs.length === 0 ? (
          <div className="card p-12 text-center space-y-3 border-dashed border-white/20">
            <Award className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Certificates Earned Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Complete your enrolled learning modules and score ≥40% on proctored assessments to unlock your digitally signed, tamper-evident certificates.
            </p>
            <Link to="/trainee/assessments" className="apple-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 font-semibold">
              View MCQ Assessments →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map((c: any) => (
            <div key={c.id} className="glass-card p-5 space-y-4 border-white/10 flex flex-col justify-between hover:border-[#2997ff]/40 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="badge-green text-[8px] font-bold">VERIFIED ACTIVE</span>
                  <span className="text-[10px] text-slate-400 font-mono">Issued {new Date(c.issuedAt).toLocaleDateString()}</span>
                </div>

                <h3 className="text-sm font-bold text-white">{c.courseTitle}</h3>
                <p className="text-xs text-slate-400">Awarded to <strong className="text-white">{c.traineeName}</strong> • {c.grade}</p>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400 break-all">
                  QR Hash: {c.certificateHash}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCert(c)}
                  className="apple-btn-secondary text-xs px-3 py-1.5 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#2997ff]" /> View Certificate & QR
                </button>
                <button
                  onClick={() => setSelectedCert(c)}
                  className="apple-btn-primary text-xs px-3 py-1.5 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      <CertificateModal
        certificate={selectedCert}
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
      />
    </DashboardLayout>
  );
};
export default Certificates;
