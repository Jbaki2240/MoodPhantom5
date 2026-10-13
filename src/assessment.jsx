// assessment.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { ArrowLeft, Brain, Plus, Salad, Footprints, MessageSquare } from "lucide-react";
import "./assessment.css";

const QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself — or that you are a failure?",
  "Trouble concentrating on things, such as reading or working?",
  "Moving or speaking so slowly that other people could have noticed?",
  "Thoughts that you would be better off dead, or of hurting yourself?"
];

const OPTIONS = [
  { val: 0, text: "Not at all" },
  { val: 1, text: "Several days" },
  { val: 2, text: "More than half the days" },
  { val: 3, text: "Nearly every day" }
];

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Questions, 2: Result Summary, 3: Recommendations
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedScore, setSelectedScore] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [saving, setSaving] = useState(false);

  // Progressive Question Form Handlers
  const handleOptionSelect = (value) => {
    setSelectedScore(value);
  };

  const handleNextQuestion = async () => {
    const updatedCumulativeScore = totalScore + selectedScore;
    setTotalScore(updatedCumulativeScore);
    setSelectedScore(null);

    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Reached the end: Sync result to Supabase before proceeding
      await saveAssessmentResult(updatedCumulativeScore);
      setStep(2);
    }
  };

  // Safe mutations to database clusters
  const saveAssessmentResult = async (finalScore) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const severity = getSeverityLabel(finalScore);

      await supabase.from("health_assessments").insert({
        user_id: user.id,
        assessment_score: finalScore,
        severity_verdict: severity,
        logged_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error writing assessment row metrics:", err.message);
    } finally {
      setSaving(false);
    }
  };

  const getSeverityLabel = (score) => {
    if (score <= 4) return "minimal";
    if (score <= 9) return "mild";
    if (score <= 14) return "moderate";
    return "severe";
  };

  // Back layout routing maps
  const handleBackAction = () => {
    if (step === 1 && currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    } else if (step === 2) {
      setStep(1);
      setCurrentQIndex(0);
      setTotalScore(0);
    } else if (step === 3) {
      setStep(2);
    } else {
      navigate(-1);
    }
  };

  const progressPercentage = ((currentQIndex + 1) / QUESTIONS.length) * 100;
  const evaluationText = getSeverityLabel(totalScore);

  return (
    <div className="assessment-container">
      {/* MASTER TOP BAR HEADER */}
      <div className="assess-header">
        <button className="back-btn" onClick={handleBackAction}>
          <ArrowLeft size={22} />
        </button>
        <h2>
          {step === 1 && "Assessment"}
          {step === 2 && "Assessment Result"}
          {step === 3 && "Recommendations"}
        </h2>
      </div>

      {/* PHASE 1: ACTIVE LIVE QUESTION FLOW */}
      {step === 1 && (
        <>
          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <div className="question-counter">Question {currentQIndex + 1} of {QUESTIONS.length}</div>
          
          <div className="question-prompt">{QUESTIONS[currentQIndex]}</div>

          <div className="options-stack">
            {OPTIONS.map((opt) => (
              <button
                key={opt.val}
                className={`option-chip ${selectedScore === opt.val ? "selected" : ""}`}
                onClick={() => handleOptionSelect(opt.val)}
              >
                <span className="option-num">{opt.val}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>

          <button
            className="assess-next-btn"
            onClick={handleNextQuestion}
            disabled={selectedScore === null || saving}
          >
            {saving ? "Saving Profile..." : "Next"}
          </button>
        </>
      )}

      {/* PHASE 2: CALCULATED VERDICT REPORT */}
      {step === 2 && (
        <div className="result-panel">
          <div className="brain-graphic-wrapper">
            <Brain size={80} className="brain-icon-img" strokeWidth={1.5} />
            <div className="heart-badge-overlay">
              <Plus size={16} strokeWidth={3} />
            </div>
          </div>

          <p className="result-verdict">
            Your responses suggest you may be experiencing <span>{evaluationText} symptoms</span> of depression.
          </p>

          <p className="result-disclaimer">
            It might be helpful to talk to a mental health professional.
          </p>

          <button className="assess-next-btn" onClick={() => setStep(3)}>
            View Suggestions
          </button>
        </div>
      )}

      {/* PHASE 3: INTERACTIVE TAILORED FEEDBACK RECS */}
      {step === 3 && (
        <div className="recommendations-flow">
          <div className="rec-card">
            <div className="rec-icon-area food"><Salad size={22} /></div>
            <div className="rec-details food">
              <h4>Food</h4>
              <p>Try to include more fruits, vegetables and protein in your meals.</p>
            </div>
          </div>

          <div className="rec-card">
            <div className="rec-icon-area activity"><Footprints size={22} /></div>
            <div className="rec-details activity">
              <h4>Activity</h4>
              <p>A 20-30 minute walk daily can improve your mood and energy.</p>
            </div>
          </div>

          <div className="rec-card">
            <div className="rec-icon-area mind"><MessageSquare size={22} /></div>
            <div className="rec-details mind">
              <h4>Mental Well-being</h4>
              <p>Talk to someone you trust or write down your thoughts to process them safely.</p>
            </div>
          </div>

          <button className="assess-next-btn" style={{marginTop: '20px'}} onClick={() => navigate("/")}>
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
