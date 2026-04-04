import React, { useEffect, useState, useCallback } from "react";
import "./lecture.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../../main";
import Loading from "../../components/loading/Loading";
import toast from "react-hot-toast";
import { TiTick } from "react-icons/ti";
import QuizPanel from "./QuizPanel";

const Lecture = ({ user }) => {
  const [lectures, setLectures] = useState([]);
  const [lecture, setLecture] = useState({});
  const [loading, setLoading] = useState(true);
  const [lecLoading, setLecLoading] = useState(false);
  const [show, setShow] = useState(false);
  const params = useParams();
  const navigate = useNavigate();

  // Admin add-lecture form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setvideo] = useState("");
  const [videoPrev, setVideoPrev] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  // Progress
  const [completed, setCompleted] = useState(0);
  const [completedLec, setCompletedLec] = useState(0);
  const [lectLength, setLectLength] = useState(0);
  const [progress, setProgress] = useState([]);

  // Quiz
  const [activeTab, setActiveTab] = useState("lectures"); // "lectures" | "quiz" | "progress"
  const [quizDue, setQuizDue] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [maxUnlocked, setMaxUnlocked] = useState(3);
  const [quizBadge, setQuizBadge] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizResult, setQuizResult] = useState(null); // stores last result for review

  if (
    user &&
    user.role !== "admin" &&
    user.role !== "tester" &&
    !user.subscription.includes(params.id)
  )
    return navigate("/");

  // ── Data fetchers ───────────────────────────────────────────────────────────
  const fetchLectures = useCallback(async () => {
    try {
      const { data } = await axios.get(`${server}/api/lectures/${params.id}`, {
        headers: { token: localStorage.getItem("token") },
      });
      setLectures(data.lectures);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }, [params.id]);

  const fetchLecture = async (id) => {
    setLecLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/lecture/${id}`, {
        headers: { token: localStorage.getItem("token") },
      });
      setLecture(data.lecture);
      setLecLoading(false);
    } catch (error) {
      setLecLoading(false);
    }
  };

  const fetchProgress = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${params.id}`,
        { headers: { token: localStorage.getItem("token") } }
      );
      setCompleted(data.courseProgressPercentage);
      setCompletedLec(data.completedLectures);
      setLectLength(data.allLectures);
      setProgress(data.progress);
    } catch (error) {
      console.log(error);
    }
  }, [params.id]);

  const fetchQuizStatus = useCallback(async () => {
    const isPrivileged = user?.role === "admin" || user?.role === "tester";
    try {
      const { data } = await axios.get(`${server}/api/quiz/check/${params.id}`, {
        headers: { token: localStorage.getItem("token") },
      });
      setMaxUnlocked(isPrivileged ? Infinity : (data.maxUnlocked ?? Infinity));

      if (data.quiz) {
        setActiveQuiz(data.quiz);

        if (data.quizAlreadyPassed) {
          // Quiz was previously passed — restore ✅ state and review data
          setQuizPassed(true);
          setQuizBadge(false);
          setQuizDue(false);
          if (data.savedResult) setQuizResult(data.savedResult);
        } else {
          // Quiz is available / pending
          setQuizBadge(!!data.quizDue);
          setQuizDue(!!data.quizDue);
        }
      } else {
        setActiveQuiz(null);
        setQuizBadge(false);
        setQuizDue(false);
      }
    } catch (e) {
      console.log("Quiz check failed:", e.message);
      if (isPrivileged) setMaxUnlocked(Infinity);
    }
  }, [params.id, user?.role]);

  // ── Progress + quiz check after video ends ─────────────────────────────────
  const addProgress = async (id) => {
    try {
      await axios.post(
        `${server}/api/user/progress?course=${params.id}&lectureId=${id}`,
        {},
        { headers: { token: localStorage.getItem("token") } }
      );
      await fetchProgress();
      await fetchQuizStatus(); // check if quiz triggered now
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchLectures();
    fetchProgress();
    fetchQuizStatus();
  }, []);

  // Auto-switch to quiz tab when quiz becomes due
  useEffect(() => {
    if (quizDue) {
      setActiveTab("quiz");
    }
  }, [quizDue]);

  // ── Admin lecture handlers ──────────────────────────────────────────────────
  const changeVideoHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => { setVideoPrev(reader.result); setvideo(file); };
  };

  const submitHandler = async (e) => {
    setBtnLoading(true);
    e.preventDefault();
    const myForm = new FormData();
    myForm.append("title", title);
    myForm.append("description", description);
    myForm.append("file", video);
    try {
      const { data } = await axios.post(`${server}/api/course/${params.id}`, myForm, {
        headers: { token: localStorage.getItem("token") },
      });
      toast.success(data.message);
      setBtnLoading(false);
      setShow(false);
      fetchLectures();
      setTitle(""); setDescription(""); setvideo(""); setVideoPrev("");
    } catch (error) {
      toast.error(error.response.data.message);
      setBtnLoading(false);
    }
  };

  const deleteHandler = async (id) => {
    if (confirm("Are you sure you want to delete this lecture")) {
      try {
        const { data } = await axios.delete(`${server}/api/lecture/${id}`, {
          headers: { token: localStorage.getItem("token") },
        });
        toast.success(data.message);
        fetchLectures();
      } catch (error) {
        toast.error(error.response.data.message);
      }
    }
  };

  // Quiz callbacks
  const handleQuizPassed = (newMaxUnlocked, resultData) => {
    setMaxUnlocked(newMaxUnlocked);
    setQuizDue(false);
    setQuizBadge(false);
    setQuizPassed(true);
    setQuizResult(resultData); // keep result for review
    // activeQuiz stays set so the quiz tab shows the completed review
    toast.success("🎉 Quiz passed!");
    setActiveTab("lectures"); // switch to lectures but quiz stays
  };

  const handleQuizFailed = () => {
    toast.error("Quiz not passed — review the lectures and try again!");
  };

  // Lectures are never locked — all freely accessible
  const isLocked = () => false;

  const progressPct = lectLength > 0 ? Math.round((completedLec / lectLength) * 100) : 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          {/* ── Tab Bar ── */}
          <div className="lecture-tab-bar">
            <button
              className={`lecture-tab-btn ${activeTab === "lectures" ? "lecture-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("lectures")}
            >
              📖 Lectures
            </button>
            <button
              className={`lecture-tab-btn ${activeTab === "quiz" ? "lecture-tab-btn--active" : ""}`}
              onClick={() => (activeQuiz || quizPassed) && setActiveTab("quiz")}
              disabled={!activeQuiz && !quizPassed}
              title={!activeQuiz && !quizPassed ? "No quiz due right now" : "View quiz"}
            >
              📝 Quiz
              {quizBadge && <span className="quiz-tab-badge">!</span>}
              {quizPassed && !quizBadge && <span className="quiz-tab-tick">✅</span>}
            </button>
            <button
              className={`lecture-tab-btn ${activeTab === "progress" ? "lecture-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("progress")}
            >
              📊 Progress
            </button>
          </div>

          {/* ── Tab: Lectures ── */}
          {activeTab === "lectures" && (
            <div className="lecture-page">
              {/* Left — video player */}
              <div className="left">
                {lecLoading ? (
                  <Loading />
                ) : (
                  <>
                    {lecture.video ? (
                      <>
                        <video
                          src={`${server}/${lecture.video}`}
                          width="100%"
                          controls
                          controlsList="nodownload noremoteplayback"
                          disablePictureInPicture
                          disableRemotePlayback
                          autoPlay
                          onEnded={() => addProgress(lecture._id)}
                        />
                        <h1 className="lecture-title">{lecture.title}</h1>
                        <h3 className="lecture-desc">{lecture.description}</h3>
                      </>
                    ) : (
                      <div className="lecture-placeholder">
                        <span>🎬</span>
                        <p>Select a lecture from the list to start watching</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right — lecture list */}
              <div className="right">
                {user?.role === "admin" && (
                  <button className="common-btn" onClick={() => setShow(!show)}>
                    {show ? "Close" : "Add Lecture +"}
                  </button>
                )}

                {show && (
                  <div className="lecture-form">
                    <h2>Add Lecture</h2>
                    <form onSubmit={submitHandler}>
                      <label>Title</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                      <label>Description</label>
                      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required />
                      <input type="file" onChange={changeVideoHandler} required />
                      {videoPrev && <video src={videoPrev} width={300} controls />}
                      <button disabled={btnLoading} type="submit" className="common-btn">
                        {btnLoading ? "Please Wait..." : "Add"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Lecture list */}
                {lectures && lectures.length > 0 ? (
                  <div className="lecture-list">
                    {lectures.map((lec, i) => {
                      const isDone =
                        progress[0] && progress[0].completedLectures.includes(lec._id);
                      const isActive = lecture._id === lec._id;
                      return (
                        <div key={lec._id}>
                          <div
                            className={`lecture-number ${isActive ? "active" : ""}`}
                            onClick={() => fetchLecture(lec._id)}
                          >
                            <span className="lec-idx">{i + 1}.</span>
                            <span className="lec-title">{lec.title}</span>
                            <span className="lec-status">
                              {isDone ? (
                                <span
                                  style={{
                                    background: "#10b981", padding: "2px", borderRadius: "50%",
                                    color: "white", display: "inline-flex", alignItems: "center",
                                    justifyContent: "center", boxShadow: "0 2px 5px rgba(16,185,129,.4)",
                                  }}
                                  title="Lecture Completed"
                                >
                                  <TiTick size={20} />
                                </span>
                              ) : null}
                            </span>
                          </div>

                          {user?.role === "admin" && (
                            <button
                              className="common-btn"
                              style={{ background: "red", marginTop: 4 }}
                              onClick={() => deleteHandler(lec._id)}
                            >
                              Delete {lec.title}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-lectures">No Lectures Yet!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="quiz-tab-content">
              {activeQuiz ? (
                <QuizPanel
                  quiz={activeQuiz}
                  courseId={params.id}
                  onPassed={handleQuizPassed}
                  onFailed={handleQuizFailed}
                  quizPassed={quizPassed}
                  savedResult={quizResult}
                />
              ) : (
                <div className="quiz-no-quiz">
                  <span>🎯</span>
                  <h3>No quiz available right now</h3>
                  <p>
                    Complete a lecture to trigger its quiz checkpoint.
                    Keep watching to unlock the next quiz!
                  </p>
                  <button className="common-btn" onClick={() => setActiveTab("lectures")}>
                    ← Back to Lectures
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Progress ── */}
          {activeTab === "progress" && (
            <div className="progress-tab-content">
              <div className="progress-card">
                <h2>Your Progress 📈</h2>

                <div className="progress-stat-grid">
                  <div className="progress-stat">
                    <span className="progress-stat-num">{completedLec}</span>
                    <span className="progress-stat-label">Completed</span>
                  </div>
                  <div className="progress-stat">
                    <span className="progress-stat-num">{lectLength}</span>
                    <span className="progress-stat-label">Total Lectures</span>
                  </div>
                  <div className="progress-stat">
                    <span className="progress-stat-num">{progressPct}%</span>
                    <span className="progress-stat-label">Course Progress</span>
                  </div>
                </div>

                <div className="progress-bar-wrap">
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="progress-bar-pct">{progressPct}%</span>
                </div>

                {progress[0]?.quizzesTaken?.length > 0 && (
                  <div className="progress-quiz-history">
                    <h3>Quiz History</h3>
                    {progress[0].quizzesTaken.map((q, i) => (
                      <div key={i} className={`quiz-history-row ${q.passed ? "quiz-history-row--pass" : "quiz-history-row--fail"}`}>
                        <span>Checkpoint {q.afterLectureIndex}</span>
                        <span>{q.score}/{q.total}</span>
                        <span>{q.passed ? "✅ Passed" : "❌ Failed"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Lecture;