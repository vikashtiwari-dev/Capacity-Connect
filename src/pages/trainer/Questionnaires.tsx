import React, { useState } from "react";
import { CheckSquare, Sparkles, Plus, Trash2, CheckCircle2, Calendar, Clock, AlertCircle } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { AiQuizGeneratorModal } from "../../components/ai/AiQuizGeneratorModal";
import { useAssessmentsStore } from "../../store/assessmentsStore";
import { useCoursesStore } from "../../store/coursesStore";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { Question } from "../../types";
import { generateAnswerHash } from "../../utils/quizSecurity";

const getDefaultDeadline = () => {
  const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days ahead
  d.setHours(23, 59, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const Questionnaires: React.FC = () => {
  const { assessments, addAssessment, deleteAssessment } = useAssessmentsStore();
  const { courses } = useCoursesStore();
  const { currentUser } = useAuthStore();
  const { addToast } = useAppStore();

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "c6");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [duration, setDuration] = useState(15);
  const [passingScore, setPassingScore] = useState(40);
  const [deadline, setDeadline] = useState(getDefaultDeadline());
  const [questions, setQuestions] = useState<Question[]>([]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Filter trainer's assessments or show recent
  const trainerAssessments = assessments.filter((a) =>
    a.createdBy === currentUser?.id ||
    a.createdBy?.toLowerCase() === currentUser?.name?.toLowerCase() ||
    currentUser?.role === "admin" ||
    a.createdBy === "Dr. Marcus Vance" ||
    a.createdBy === "Faculty Trainer"
  );

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: "q-" + Date.now(),
      text: "New custom question prompt...",
      options: [
        { id: "o1", text: "Option A" },
        { id: "o2", text: "Option B" },
        { id: "o3", text: "Option C" },
        { id: "o4", text: "Option D" }
      ],
      correctIndex: 0,
      points: 20
    };
    setQuestions([...questions, newQ]);
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentTitle.trim() || questions.length === 0) {
      addToast({
        title: "Incomplete Assessment",
        message: "Please provide a title and at least one question.",
        type: "warning"
      });
      return;
    }

    const securedQuestions = questions.map((q) => ({
      ...q,
      answerHash: generateAnswerHash(q.id, q.correctIndex ?? 0)
    }));

    const finalDeadline = deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString();

    addAssessment({
      courseId: selectedCourseId,
      courseTitle: selectedCourse?.title || "Cloud Architecture",
      title: assessmentTitle,
      description: "Subject-wise evaluation for " + (selectedCourse?.title || "course"),
      deadline: finalDeadline,
      durationMinutes: duration,
      passingScore,
      createdBy: currentUser?.name || "Faculty Trainer",
      questions: securedQuestions
    });

    setAssessmentTitle("");
    setQuestions([]);
    setDeadline(getDefaultDeadline());
    addToast({
      title: "Assessment Published Successfully",
      message: `Trainees can now attempt this evaluation until ${new Date(finalDeadline).toLocaleDateString()}.`,
      type: "success"
    });
  };

  return (
    <DashboardLayout
      pageTitle="Assessment & Questionnaire Authoring"
      breadcrumbs={[
        { label: "Trainer Dashboard", to: "/trainer/dashboard" },
        { label: "Create Assessments" }
      ]}
    >
      <div className="space-y-6">
        <div className="glass-panel p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Create Proctored MCQ Assessment / Assignment</h3>
            <p className="text-xs text-slate-400">Design timed evaluations with custom submission deadlines or leverage generative AI</p>
          </div>

          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="apple-btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> AI Quiz Generator
          </button>
        </div>

        <form onSubmit={handleSaveAssessment} className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Course</label>
              <select
                className="apple-input text-xs"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assessment / Assignment Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Cloud Certification Midterm Exam"
                className="apple-input text-xs"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-white">
                  <Calendar className="w-3.5 h-3.5 text-[#2997ff]" />
                  Submission Deadline
                </span>
                <span className="text-[10px] text-[#2997ff] font-semibold">Strict Cut-off</span>
              </label>
              <input
                type="datetime-local"
                required
                className="apple-input text-xs cursor-pointer"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Min)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  className="apple-input text-xs"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pass %</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  className="apple-input text-xs"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold text-white">Questions in Assessment ({questions.length})</h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs text-[#2997ff] hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Manual Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-white/15 text-center space-y-2">
                <CheckSquare className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No questions added to this assessment yet</p>
                <p className="text-[11px] text-slate-500">
                  Click <span className="text-[#2997ff]">Add Manual Question</span> above or use the <span className="text-[#2997ff]">AI Quiz Generator</span> to auto-create high-quality questions.
                </p>
              </div>
            ) : (
              questions.map((q, qIdx) => (
                <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Question {qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                      className="text-rose-400 p-1 hover:text-rose-300 transition"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    className="apple-input text-xs font-semibold"
                    placeholder="Enter question text..."
                    value={q.text}
                    onChange={(e) => {
                      const next = [...questions];
                      next[qIdx].text = e.target.value;
                      setQuestions(next);
                    }}
                  />

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold block">Select the correct answer option:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                          <input
                            type="radio"
                            name={"correct-" + q.id}
                            checked={q.correctIndex === oIdx}
                            onChange={() => {
                              const next = [...questions];
                              next[qIdx].correctIndex = oIdx;
                              setQuestions(next);
                            }}
                            className="cursor-pointer"
                          />
                          <input
                            type="text"
                            className="apple-input text-xs py-1"
                            value={opt.text}
                            onChange={(e) => {
                              const next = [...questions];
                              next[qIdx].options[oIdx].text = e.target.value;
                              setQuestions(next);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="submit" className="apple-btn-primary text-xs px-6 py-2.5 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Save & Publish Assessment
          </button>
        </form>

        {/* Published Questionnaires & Assessments List */}
        <div className="space-y-4 pt-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#2997ff]" />
              Published Questionnaires & Assessments ({trainerAssessments.length})
            </h3>
            <p className="text-xs text-slate-400">
              Live evaluations with real-time student synchronization, passing thresholds, and configured submission deadlines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainerAssessments.map((a) => {
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
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                        isExpired 
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isExpired ? `Expired: ${formattedDeadline}` : `Due: ${formattedDeadline}`}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">{a.title}</h4>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>{a.questions.length} MCQ Questions</span>
                      <span>•</span>
                      <span>{a.durationMinutes} Mins Timed</span>
                      <span>•</span>
                      <span>Pass: {a.passingScore}%</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">Created by: {a.createdBy}</span>
                    <button
                      type="button"
                      onClick={() => {
                        deleteAssessment(a.id);
                        addToast({
                          title: "Assessment Deleted",
                          message: "The assessment has been removed from the platform catalog.",
                          type: "info"
                        });
                      }}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-500/10 transition"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AiQuizGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onQuestionsGenerated={(generated) => setQuestions([...questions, ...generated])}
        courseTitle={selectedCourse?.title || "Cloud Architecture"}
      />
    </DashboardLayout>
  );
};
export default Questionnaires;
