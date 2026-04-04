import React, { useEffect, useState } from "react";
import axios from "axios";
import { server } from "../../main";
import toast from "react-hot-toast";
import "./quizmanager.css";

const EMPTY_QUESTION = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  explanation: "",
});

const EMPTY_QUIZ = (courseId) => ({
  courseId,
  afterLectureIndex: 3,
  title: "",
  passingScore: 60,
  questions: [EMPTY_QUESTION()],
});

const QuizManager = ({ courseId, courseTitle, onClose }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [attemptsView, setAttemptsView] = useState(null); // { quiz } or null
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [resetting, setResetting] = useState(null); // userId being reset

  const headers = { token: localStorage.getItem("token") };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/admin/quiz/${courseId}`, { headers });
      setQuizzes(data.quizzes);
      setStats(data.stats);
    } catch (e) {
      toast.error("Failed to load quizzes");
    }
    setLoading(false);
  };

  const fetchAttempts = async (quiz) => {
    setAttemptsView(quiz);
    setAttemptsLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/admin/quiz/attempts/${quiz._id}`, { headers });
      setAttempts(data.attempts);
    } catch (e) {
      toast.error("Failed to load attempts");
    }
    setAttemptsLoading(false);
  };

  const handleReset = async (userId, userName) => {
    if (!confirm(`Reset quiz attempt for ${userName}? They will be able to retake it.`)) return;
    setResetting(userId);
    try {
      await axios.delete(
        `${server}/api/admin/quiz/reset/${attemptsView._id}/user/${userId}`,
        { headers }
      );
      toast.success(`Quiz reset for ${userName}`);
      fetchAttempts(attemptsView); // refresh list
    } catch (e) {
      toast.error(e.response?.data?.message || "Reset failed");
    }
    setResetting(null);
  };

  useEffect(() => { fetchQuizzes(); }, [courseId]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const startNew = () => {
    setEditingQuiz(EMPTY_QUIZ(courseId));
    setIsNew(true);
  };

  const startEdit = async (quizId) => {
    try {
      const { data } = await axios.get(`${server}/api/admin/quiz/detail/${quizId}`, { headers });
      setEditingQuiz({ ...data.quiz, courseId });
      setIsNew(false);
    } catch (e) {
      toast.error("Failed to load quiz");
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!confirm("Delete this quiz? Students' quiz history for this checkpoint will remain.")) return;
    try {
      await axios.delete(`${server}/api/admin/quiz/${quizId}`, { headers });
      toast.success("Quiz deleted");
      fetchQuizzes();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const setField = (field, value) =>
    setEditingQuiz((prev) => ({ ...prev, [field]: value }));

  const setQuestion = (qi, field, value) =>
    setEditingQuiz((prev) => {
      const questions = [...prev.questions];
      questions[qi] = { ...questions[qi], [field]: value };
      return { ...prev, questions };
    });

  const setOption = (qi, oi, value) =>
    setEditingQuiz((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qi].options];
      options[oi] = value;
      questions[qi] = { ...questions[qi], options };
      return { ...prev, questions };
    });

  const addQuestion = () => {
    if (editingQuiz.questions.length >= 10) return toast.error("Max 10 questions");
    setEditingQuiz((prev) => ({ ...prev, questions: [...prev.questions, EMPTY_QUESTION()] }));
  };

  const removeQuestion = (qi) => {
    if (editingQuiz.questions.length <= 1) return toast.error("Need at least 1 question");
    setEditingQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qi),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Validate
    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const q = editingQuiz.questions[i];
      if (!q.questionText.trim()) return toast.error(`Q${i + 1}: Question text is required`);
      for (let oi = 0; oi < 4; oi++) {
        if (!q.options[oi].trim()) return toast.error(`Q${i + 1}: All 4 options are required`);
      }
    }

    setSaving(true);
    try {
      if (isNew) {
        await axios.post(`${server}/api/admin/quiz`, editingQuiz, { headers });
        toast.success("Quiz created!");
      } else {
        await axios.put(`${server}/api/admin/quiz/${editingQuiz._id}`, editingQuiz, { headers });
        toast.success("Quiz updated!");
      }
      setEditingQuiz(null);
      fetchQuizzes();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    }
    setSaving(false);
  };

  const getStat = (afterLectureIndex) =>
    stats.find((s) => s.afterLectureIndex === afterLectureIndex);

  // ── Render: Attempts view ──────────────────────────────────────────────────
  if (attemptsView) {
    return (
      <div className="qm-overlay" onClick={(e) => e.target === e.currentTarget && setAttemptsView(null)}>
        <div className="qm-modal qm-modal--wide">
          <div className="qm-modal-header">
            <div>
              <h2>📄 Student Attempts</h2>
              <p>
                <strong>{attemptsView.title || `Quiz at checkpoint ${attemptsView.afterLectureIndex}`}</strong>
                {" "}— After Lecture {attemptsView.afterLectureIndex} • Passing: {attemptsView.passingScore}%
              </p>
            </div>
            <button className="qm-close-btn" onClick={() => setAttemptsView(null)}>✕</button>
          </div>

          <div className="qm-modal-body">
            {attemptsLoading ? (
              <div className="qm-loading">Loading attempts…</div>
            ) : attempts.length === 0 ? (
              <div className="qm-empty">
                <span>👤</span>
                <p>No students have attempted this quiz yet.</p>
              </div>
            ) : (
              <div className="qm-attempts-wrap">
                <p className="qm-attempts-summary">
                  <strong>{attempts.length}</strong> attempt{attempts.length !== 1 ? "s" : ""} —{" "}
                  <strong>{attempts.filter(a => a.passed).length}</strong> passed,{" "}
                  <strong>{attempts.filter(a => !a.passed).length}</strong> failed
                </p>
                <table className="qm-attempts-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr key={a.userId} className={a.passed ? "qm-row--pass" : "qm-row--fail"}>
                        <td><strong>{a.name}</strong></td>
                        <td className="qm-email">{a.email}</td>
                        <td>
                          <span className="qm-score-pill">
                            {a.score}/{a.total} ({a.scorePercent}%)
                          </span>
                        </td>
                        <td>
                          <span className={`qm-result-badge ${a.passed ? "qm-badge--pass" : "qm-badge--fail"}`}>
                            {a.passed ? "✅ Passed" : "❌ Failed"}
                          </span>
                        </td>
                        <td className="qm-date">
                          {a.attemptedAt ? new Date(a.attemptedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          }) : "—"}
                        </td>
                        <td>
                          <button
                            className="qm-reset-btn"
                            onClick={() => handleReset(a.userId, a.name)}
                            disabled={resetting === a.userId}
                            title="Reset attempt so student can retake"
                          >
                            {resetting === a.userId ? "⏳" : "🔄 Reset"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Edit form ──────────────────────────────────────────────────────
  if (editingQuiz) {
    return (
      <div className="qm-overlay" onClick={(e) => e.target === e.currentTarget && setEditingQuiz(null)}>
        <div className="qm-modal qm-modal--wide">
          <div className="qm-modal-header">
            <div>
              <h2>{isNew ? "Create New Quiz" : "Edit Quiz"}</h2>
              <p>{courseTitle}</p>
            </div>
            <button className="qm-close-btn" onClick={() => setEditingQuiz(null)}>✕</button>
          </div>

          <form onSubmit={handleSave} className="qm-form">
            {/* Quiz meta */}
            <div className="qm-form-row">
              <div className="qm-field">
                <label>Quiz Title</label>
                <input
                  type="text"
                  value={editingQuiz.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder={`e.g. Quiz after Lecture ${editingQuiz.afterLectureIndex}`}
                />
              </div>
              <div className="qm-field qm-field--sm">
                <label>Trigger after lecture # (any number ≥ 1)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={editingQuiz.afterLectureIndex}
                  onChange={(e) => setField("afterLectureIndex", Number(e.target.value))}
                  required
                />
              </div>
              <div className="qm-field qm-field--sm">
                <label>Passing Score (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editingQuiz.passingScore}
                  onChange={(e) => setField("passingScore", Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Questions */}
            <div className="qm-questions">
              {editingQuiz.questions.map((q, qi) => (
                <div key={qi} className="qm-question-block">
                  <div className="qm-question-header">
                    <span className="qm-q-num">Q{qi + 1}</span>
                    {editingQuiz.questions.length > 1 && (
                      <button type="button" className="qm-remove-q-btn" onClick={() => removeQuestion(qi)}>🗑</button>
                    )}
                  </div>

                  <div className="qm-field">
                    <label>Question Text</label>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => setQuestion(qi, "questionText", e.target.value)}
                      placeholder="Write your question here..."
                      required
                    />
                  </div>

                  <div className="qm-options-grid">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`qm-option-row ${q.correctAnswer === oi ? "qm-option-row--correct" : ""}`}>
                        <button
                          type="button"
                          className={`qm-correct-dot ${q.correctAnswer === oi ? "qm-correct-dot--active" : ""}`}
                          onClick={() => setQuestion(qi, "correctAnswer", oi)}
                          title="Mark as correct"
                        >
                          {q.correctAnswer === oi ? "✓" : String.fromCharCode(65 + oi)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => setOption(qi, oi, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="qm-field">
                    <label>Explanation (shown after answer) — optional</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => setQuestion(qi, "explanation", e.target.value)}
                      placeholder="Why is this the correct answer?"
                    />
                  </div>
                </div>
              ))}

              <button type="button" className="qm-add-q-btn" onClick={addQuestion}>
                + Add Question
              </button>
            </div>

            <div className="qm-form-actions">
              <button type="button" className="qm-cancel-btn" onClick={() => setEditingQuiz(null)}>
                Cancel
              </button>
              <button type="submit" className="qm-save-btn" disabled={saving}>
                {saving ? "Saving..." : isNew ? "Create Quiz" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: List view ──────────────────────────────────────────────────────
  return (
    <div className="qm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qm-modal">
        <div className="qm-modal-header">
          <div>
            <h2>📝 Quiz Manager</h2>
            <p>{courseTitle}</p>
          </div>
          <button className="qm-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="qm-modal-body">
          <div className="qm-top-bar">
            <p className="qm-hint">
              Set any trigger lecture number. Quiz becomes available to students at that checkpoint.
            </p>
            <button className="qm-create-btn" onClick={startNew}>+ New Quiz</button>
          </div>

          {loading ? (
            <div className="qm-loading">Loading quizzes…</div>
          ) : quizzes.length === 0 ? (
            <div className="qm-empty">
              <span>📋</span>
              <p>No quizzes yet. Create one to start gating lectures!</p>
            </div>
          ) : (
            <div className="qm-quiz-list">
              {quizzes.map((quiz) => {
                const stat = getStat(quiz.afterLectureIndex);
                return (
                  <div key={quiz._id} className="qm-quiz-row">
                    <div className="qm-quiz-info">
                      <span className="qm-checkpoint-badge">After Lec {quiz.afterLectureIndex}</span>
                      <div>
                        <p className="qm-quiz-title">{quiz.title || `Quiz at checkpoint ${quiz.afterLectureIndex}`}</p>
                        <p className="qm-quiz-meta">
                          {quiz.questions.length} questions · Passing: {quiz.passingScore}%
                        </p>
                      </div>
                    </div>

                    <div className="qm-quiz-stats">
                      {stat ? (
                        <>
                          <div className="qm-stat">
                            <span>{stat.totalAttempts}</span>
                            <span>Attempts</span>
                          </div>
                          <div className="qm-stat">
                            <span>{stat.totalPassed}</span>
                            <span>Passed</span>
                          </div>
                          <div className={`qm-stat ${stat.passRate !== null && stat.passRate < 50 ? "qm-stat--warn" : ""}`}>
                            <span>{stat.passRate !== null ? `${stat.passRate}%` : "—"}</span>
                            <span>Pass Rate</span>
                          </div>
                        </>
                      ) : null}
                    </div>

                    <div className="qm-quiz-actions">
                      <button className="qm-attempts-btn" onClick={() => fetchAttempts(quiz)}>
                        👥 Attempts
                      </button>
                      <button className="qm-edit-btn" onClick={() => startEdit(quiz._id)}>Edit</button>
                      <button className="qm-delete-btn" onClick={() => deleteQuiz(quiz._id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizManager;
