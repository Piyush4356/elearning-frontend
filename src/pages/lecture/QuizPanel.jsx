import React, { useState } from "react";
import axios from "axios";
import { server } from "../../main";

const QuizPanel = ({ quiz, courseId, onPassed, onFailed, quizPassed, savedResult }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  // If already passed and saved result exists, open directly in review mode
  const [submitted, setSubmitted] = useState(!!savedResult);
  const [result, setResult] = useState(savedResult || null);
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const total = quiz.questions.length;
  const current = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / total) * 100;
  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === total;

  const selectAnswer = (optionIndex) => {
    if (submitted) return;
    const updated = [...answers];
    updated[currentIndex] = optionIndex;
    setAnswers(updated);
  };

  const goNext = () => currentIndex < total - 1 && setCurrentIndex(currentIndex + 1);
  const goPrev = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/quiz/${quiz._id}/submit`,
        { answers, courseId },
        { headers: { token: localStorage.getItem("token") } }
      );
      setResult(data);
      setSubmitted(true);
      setLoading(false);
      // NOTE: Don't call onPassed/onFailed here — let the result screen render first.
      // The user clicks "Continue" button to proceed.
    } catch (e) {
      setLoading(false);
      console.error("Quiz submit error:", e);
    }
  };

  const handleRetake = () => {
    setAnswers(Array(quiz.questions.length).fill(null));
    setSubmitted(false);
    setResult(null);
    setCurrentIndex(0);
    setShowReview(false);
  };

  // ── Results screen ────────────────────────────────────────────────────────
  if (submitted && result) {
    const pct = result.scorePercent;
    const passed = result.passed;
    return (
      <div className="quiz-result-screen">

        {/* Completed banner — shown when user re-visits after passing */}
        {quizPassed && (
          <div className="quiz-completed-banner">
            ✅ Quiz Completed — you scored <strong>{result.score}/{result.total} ({pct}%)</strong>
          </div>
        )}

        <div className={`quiz-score-card ${passed ? "quiz-score-card--pass" : "quiz-score-card--fail"}`}>
          <div className="quiz-score-emoji">{passed ? "🎉" : "😓"}</div>
          <h2>{passed ? "You Passed!" : "Not quite there yet"}</h2>
          <div className="quiz-score-circle">
            <span className="quiz-score-big">{result.score}/{result.total}</span>
            <span className="quiz-score-pct">{pct}%</span>
          </div>
          <p className="quiz-score-msg">
            {passed
              ? `Great job! You scored ${pct}% — well done! 🚀`
              : `You scored ${pct}% — passing score is ${result.passingScore}%. Review the lectures and try again!`}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            {passed && !quizPassed && (
              <button
                className="quiz-submit-btn"
                onClick={() => onPassed(result.maxUnlocked, result)}
              >
                Continue to Lectures →
              </button>
            )}
            {!passed && (
              <button className="quiz-retake-btn" onClick={handleRetake}>
                🔄 Retake Quiz
              </button>
            )}
            {quizPassed && (
              <p style={{ fontSize: 13, color: "var(--text-dim)", margin: 0 }}>
                📖 Scroll down to review your answers
              </p>
            )}
          </div>
        </div>

        {/* Answer review — always shown after submitting */}
        <div className="quiz-review">
          <h3>📚 Answer Review</h3>
          {result.results.map((r, i) => (
            <div key={i} className={`quiz-review-item ${r.isCorrect ? "correct" : "wrong"}`}>
              <p className="quiz-review-q">
                <span className="quiz-review-num">Q{i + 1}.</span> {r.questionText}
              </p>
              <div className="quiz-review-options">
                {r.options.map((opt, oi) => {
                  let cls = "quiz-review-opt";
                  if (oi === r.correctAnswer) cls += " correct-opt";
                  else if (oi === r.selectedAnswer && !r.isCorrect) cls += " wrong-opt";
                  return (
                    <div key={oi} className={cls}>
                      {oi === r.correctAnswer && <span>✅ </span>}
                      {oi === r.selectedAnswer && !r.isCorrect && <span>❌ </span>}
                      {opt}
                    </div>
                  );
                })}
              </div>
              {r.explanation && (
                <p className="quiz-review-exp">💡 {r.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Question screen (one at a time) ──────────────────────────────────────
  return (
    <div className="quiz-panel">
      {/* Header */}
      <div className="quiz-panel-header">
        <div className="quiz-meta">
          <span className="quiz-tag">📝 Quiz</span>
          <span className="quiz-checkpoint">After Lecture {quiz.afterLectureIndex}</span>
        </div>
        <h2>{quiz.title || `Quiz · Checkpoint ${quiz.afterLectureIndex}`}</h2>
        <p className="quiz-subtitle">
          Answer all {total} questions. Passing score:{" "}
          <strong>{quiz.passingScore}%</strong>
        </p>
      </div>

      {/* Progress bar */}
      <div className="quiz-progress-wrap">
        <div className="quiz-progress-label">
          Question <strong>{currentIndex + 1}</strong> of <strong>{total}</strong>
          <span className="quiz-answered-count">{answeredCount} answered</span>
        </div>
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {/* Dot nav */}
        <div className="quiz-dot-nav">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              className={`quiz-dot ${i === currentIndex ? "quiz-dot--active" : ""} ${
                answers[i] !== null ? "quiz-dot--done" : ""
              }`}
              onClick={() => setCurrentIndex(i)}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="quiz-question-card">
        <p className="quiz-question-num">Question {currentIndex + 1}</p>
        <h3 className="quiz-question-text">{current.questionText}</h3>

        <div className="quiz-options">
          {current.options.map((opt, oi) => (
            <button
              key={oi}
              className={`quiz-option ${answers[currentIndex] === oi ? "quiz-option--selected" : ""}`}
              onClick={() => selectAnswer(oi)}
            >
              <span className="quiz-option-letter">
                {String.fromCharCode(65 + oi)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="quiz-nav">
        <button
          className="quiz-nav-btn quiz-nav-btn--prev"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        {currentIndex < total - 1 ? (
          <button
            className="quiz-nav-btn quiz-nav-btn--next"
            onClick={goNext}
          >
            Next →
          </button>
        ) : (
          <button
            className={`quiz-submit-btn ${!allAnswered ? "quiz-submit-btn--disabled" : ""}`}
            onClick={handleSubmit}
            disabled={!allAnswered || loading}
          >
            {loading ? "Submitting..." : `Submit Quiz${!allAnswered ? ` (${total - answeredCount} left)` : " ✓"}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPanel;
