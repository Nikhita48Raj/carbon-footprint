"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    location: "",
    householdSize: 1,
    transportation: "car",
    diet: "omnivore"
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.progress}>
          Step {step} of 3
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>

        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className="heading-lg">Welcome!</h2>
            <p className={styles.subtitle}>Let's personalize your experience.</p>
            
            <label className={styles.label}>Where do you live?</label>
            <input type="text" className={styles.input} placeholder="e.g. New York, USA" />
            
            <label className={styles.label}>Household size</label>
            <input type="number" min="1" className={styles.input} defaultValue={1} />
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <h2>Transportation Habits</h2>
            <p className={styles.subtitle}>How do you primarily get around?</p>
            
            <div className={styles.options}>
              <button className={styles.optionCard}>Personal Car</button>
              <button className={styles.optionCard}>Public Transit</button>
              <button className={styles.optionCard}>Walking / Cycling</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContent}>
            <h2>Diet Preferences</h2>
            <p className={styles.subtitle}>Your diet plays a big role in your footprint.</p>
            
            <div className={styles.options}>
              <button className={styles.optionCard}>Omnivore</button>
              <button className={styles.optionCard}>Vegetarian</button>
              <button className={styles.optionCard}>Vegan</button>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {step > 1 && <button className={styles.btnSecondary} onClick={() => setStep(step - 1)}>Back</button>}
          <button className="btn-primary" onClick={handleNext}>
            {step === 3 ? "Calculate Footprint" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
