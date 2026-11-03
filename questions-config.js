// ============================================
// EVENT + QUESTIONS CONFIG
// ============================================
// Edit the EVENT section to change event name, date, venue,
// or tagline. The form and dashboard automatically read this file.

export const EVENT = {
  name: "HYMNS Activity Questionnaire",
  tagline: "Neuropathic Pain Clinical Insights",
  dates: "2026",
  venue: "HYMNS Activity",
};

// Each question requires:
// id: unique question ID
// label: question text
// allowMultiple: true for multiple selections
// allowMultiple: false for only one selection
// options: available answer choices

export const QUESTIONS = [
  {
    id: "q1",
    label:
      "Based on your clinical experience, what proportion of patients encountered in your neurosurgical practice have a neuropathic pain component?",
    allowMultiple: false,
    options: [
      "<15%",
      "16–25%",
      "26–50%",
      ">50%",
    ],
  },

  {
    id: "q2",
    label:
      "Which unmet need do you encounter most frequently in the management of neuropathic pain in neurosurgical practice?",
    allowMultiple: false,
    options: [
      "Early recognition of neuropathic pain",
      "Sustained long-term pain control",
      "Balancing efficacy with tolerability",
      "Improving patient adherence to therapy",
    ],
  },

  {
    id: "q3",
    label:
      "In which indication do you most commonly prefer Gabapentin + Nortriptyline Combination?",
    allowMultiple: false,
    options: [
      "Lumbar radiculopathy",
      "Cervical radiculopathy",
      "Postoperative neuropathic pain following spine surgery",
      "Trigeminal neuralgia",
      "Other — Please specify",
    ],
  },

  {
    id: "q4",
    label:
      "What is your preferred dosage for Gabapentin + Nortriptyline Combination?",
    allowMultiple: false,
    options: [
      "Gabapentin 100 mg + Nortriptyline 10 mg",
      "Gabapentin 200 mg + Nortriptyline 10 mg",
      "Gabapentin 300 mg + Nortriptyline 10 mg",
      "Gabapentin 400 mg + Nortriptyline 10 mg",
    ],
  },

  {
    id: "q5",
    label:
      "How would you rate the efficacy-to-side-effect ratio of the Gabapentin + Nortriptyline combination compared to maximizing the dose of either drug alone?",
    allowMultiple: false,
    options: [
      "Superior pain control with fewer side effects",
      "Similar pain control but increased adverse effects (e.g., sedation, dry mouth)",
      "No noticeable clinical difference",
      "I do not use or prescribe this specific combination",
    ],
  },

  {
    id: "q6",
    label:
      "In which area can we collaborate with eminent Neurosurgeons like you to advance neuropathic pain management?",
    allowMultiple: true,
    options: [
      "Continuous Medical Education (CME) on management of neuropathic pain in Spine Practice",
      "Consensus recommendations for managing radiculopathy",
      "Investigator-initiated clinical research in neuropathic pain",
      "Neurosurgeon-led educational programmes on neuropathic pain",
    ],
  },
];