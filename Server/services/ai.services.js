import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, 
  maxRetries: 2
});

const trimText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) : text;
};

export const analyzeResumeWithJob = async (
  resumeText,
  jobDescription,
  jobTitle = "Job Role"
) => {
  const safeResume = trimText(resumeText, 2000); 
  const safeJob = trimText(jobDescription, 2000); 

  const prompt = `
You are an experienced ATS evaluator and industry recruiter.

Evaluate the RESUME strictly for the following role.

Job Title:
${jobTitle}

Job Description:
${safeJob}

Resume:
${safeResume}

Evaluation Guidelines:
- Infer required skills, expectations, and seniority ONLY from the job description
- Judge real relevance, not surface-level keywords
- Be strict like a real ATS + recruiter
- Provide DETAILED and COMPREHENSIVE lists (aim for 8-12 items per array)

Evaluate on:
1. Technical / Role-Specific Skills
2. Projects / Practical Experience
3. Core Knowledge relevant to this role
4. Education relevance
5. Certifications relevance
6. Resume Structure & ATS friendliness

Return ONLY valid JSON in EXACT format:

{
  "overallScore": number,
  "sectionScores": {
    "technicalSkills": number,
    "projects": number,
    "coreKnowledge": number,
    "education": number,
    "certifications": number,
    "atsStructure": number
  },
  "matchingSkills": string[],
  "missingSkills": string[],
  "sectionAnalysis": {
    "technicalSkills": "string",
    "projects": "string",
    "coreKnowledge": "string",
    "education": "string",
    "certifications": "string",
    "atsStructure": "string"
  },
  "majorWeaknesses": string[],
  "mustDoImprovements": string[],
  "honestVerdict": "string"
}

IMPORTANT:
- matchingSkills: List 8-12 specific skills/keywords found in BOTH resume and job description
- missingSkills: List 8-12 important skills from job description NOT found in resume
- majorWeaknesses: List 5-8 critical issues with the resume
- mustDoImprovements: List 6-10 actionable improvements
- All scores must be between 0–100
- Be realistic and recruiter-like
- No markdown, no explanations outside JSON
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 3000 
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty OpenAI response");

    console.log("📝 Raw AI Response Length:", raw.length);

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F]+/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ Invalid JSON from AI:", cleaned);
      throw new Error("Malformed AI JSON");
    }

    console.log("✅ Parsed Analysis:", {
      matchingSkillsCount: parsed.matchingSkills?.length || 0,
      missingSkillsCount: parsed.missingSkills?.length || 0,
      weaknessesCount: parsed.majorWeaknesses?.length || 0,
      improvementsCount: parsed.mustDoImprovements?.length || 0
    });

    return {
      overallScore: Number(parsed.overallScore) || 0,

      strengths: Array.isArray(parsed.matchingSkills)
        ? parsed.matchingSkills
        : [],

      gaps: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills
        : [],

      keywordMatches: [
        ...(parsed.matchingSkills || []).map(skill => ({
          keyword: skill,
          found: true
        })),
        ...(parsed.missingSkills || []).map(skill => ({
          keyword: skill,
          found: false
        }))
      ],

      sectionScores: parsed.sectionScores || {
        technicalSkills: 0,
        projects: 0,
        coreKnowledge: 0,
        education: 0,
        certifications: 0,
        atsStructure: 0
      },

      skillsBreakdown: {
        technical: Number(parsed.sectionScores?.technicalSkills) || 0,
        projects: Number(parsed.sectionScores?.projects) || 0,
        coreKnowledge: Number(parsed.sectionScores?.coreKnowledge) || 0,
        education: Number(parsed.sectionScores?.education) || 0,
        certifications: Number(parsed.sectionScores?.certifications) || 0,
        atsStructure: Number(parsed.sectionScores?.atsStructure) || 0
      },

      detailedAnalysis: parsed.sectionAnalysis || {},

      majorWeaknesses: Array.isArray(parsed.majorWeaknesses)
        ? parsed.majorWeaknesses
        : [],

      mustDoImprovements: Array.isArray(parsed.mustDoImprovements)
        ? parsed.mustDoImprovements
        : [],

      honestVerdict: parsed.honestVerdict || "",

      recommendations: [
        ...(parsed.mustDoImprovements || [])
      ]
    };

  } catch (error) {
    console.error("🚨 OpenAI analysis error:", error.message);

    return {
      overallScore: 0,
      strengths: ["Unable to analyze - please try again"],
      gaps: ["Analysis failed"],
      keywordMatches: [],
      sectionScores: {
        technicalSkills: 0,
        projects: 0,
        coreKnowledge: 0,
        education: 0,
        certifications: 0,
        atsStructure: 0
      },
      skillsBreakdown: {
        technical: 0,
        projects: 0,
        coreKnowledge: 0,
        education: 0,
        certifications: 0,
        atsStructure: 0
      },
      detailedAnalysis: {},
      majorWeaknesses: ["AI analysis failed"],
      mustDoImprovements: ["Please try analyzing again"],
      honestVerdict: "Resume analysis could not be completed at this time.",
      recommendations: ["AI analysis failed. Please try again."]
    };
  }
};