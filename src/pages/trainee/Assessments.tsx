import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Clock, Award, CheckCircle2,
  AlertTriangle, ArrowRight, BookOpen, Brain, Play, Calendar
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAssessmentsStore } from "../../store/assessmentsStore";
import { useAuthStore } from "../../store/authStore";
import { initialAssessments } from "../../data/seed";
import { useAppStore } from "../../store/appStore";

export const Assessments: React.FC = () => {
  const { assessments, attempts } = useAssessmentsStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const displayAssessments = assessments.length > 0 ? assessments : initialAssessments;

  return (
    <DashboardLayout
      pageTitle="Subject-Wise MCQ Assessments"
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Assessments" }]}
    >
      <div className="space-y-6">
        <div className="glass-panel p-5 border border-white/15 shadow-2xl relative overflow-hidden bg-gradient-to-r from-[#0c0f1c] via-[#101426] to-[#0a0d16]">
          <div className="max-w-2xl space-y-1">
            <span className="badge-blue text-[9px] uppercase font-bold tracking-wider">
              Certification Assessments
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Subject-Wise MCQ Assessments
            </h2>
            <p className="text-xs text-slate-300">
              Timed subject-wise evaluations featuring randomized question banks, tab-switch monitoring, and instant verifiable certificate generation upon achieving passing threshold (≥40%).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayAssessments.map((a) => {
            const attempt = attempts.find((att) => att.assessmentId === a.id && att.traineeId === currentUser?.id);
            const isPassed = attempt && attempt.passed;
            const isFailed = attempt && !attempt.passed;
            const isExpired = a.deadline ? new Date(a.deadline) < new Date() : false;
            const formattedDeadline = a.deadline ? new Date(a.deadline).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short"
            }) : "Open";

            return (
              <div key={a.id} className="glass-card p-5 space-y-4 border-white/10 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge-blue text-[8px]">{a.courseTitle}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#2997ff]" /> {a.durationMinutes} Mins
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isExpired
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isExpired ? `Closed: ${formattedDeadline}` : `Due: ${formattedDeadline}`}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight">{a.title}</h3>
                  <p className="text-xs text-slate-400">{a.questions.length} MCQ Questions • Passing Score: {a.passingScore}%</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    {isPassed ? (
                      <span className="badge-green text-[9px] font-bold">PASSED ({attempt.percentage}%)</span>
                    ) : isFailed ? (
                      <span className="badge-red text-[9px] font-bold">FAILED ({attempt.percentage}%)</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">PENDING ATTEMPT</span>
                    )}
                  </div>

                  {isExpired && !isPassed ? (
                    <span className="text-xs text-rose-400 font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 cursor-not-allowed">
                      Deadline Passed
                    </span>
                  ) : (
                    <Link
                      to={`/trainee/assessment/${a.id}`}
                      className="apple-btn-primary text-xs px-3.5 py-1.5 font-semibold flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-white" /> {isPassed ? "Review Exam" : "Start Proctored Exam"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Assessments;
