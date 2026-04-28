const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Service
 * Provides AI-powered analysis and insights using Google's Gemini API
 */

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get Gemini model instance
 * @param {string} modelName - Model to use (default: gemini-2.5-flash)
 * @returns {object} Gemini model instance
 */
const getModel = (modelName = 'gemini-2.5-flash') => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Analyze audit responses and generate detailed insights
 * @param {object} auditData - Audit data including answers and scores
 * @returns {Promise<string>} AI-generated insights and recommendations
 */
const analyzeAuditResponses = async (auditData) => {
  try {
    const model = getModel();

    // Build detailed prompt for audit analysis
    const prompt = `
You are a cybersecurity expert analyzing a company's trade secret protection audit.

**Audit Overview:**
- Company: ${auditData.companyName || 'Not specified'}
- Overall Score: ${auditData.overallScore}%
- Risk Level: ${auditData.riskLevel}
- Total Questions: ${auditData.answers?.length || 0}

**Category Scores:**
${auditData.categoryScores?.map(cat => `- ${cat.category}: ${cat.score}% (${cat.earnedPoints}/${cat.maxPoints} points)`).join('\n')}

**Detailed Responses:**
${auditData.answers?.map((answer, idx) => `
Question ${idx + 1}: ${answer.questionText}
Category: ${answer.category}
Answer: ${answer.selectedOption.label} (${answer.selectedOption.value} points)
Description: ${answer.selectedOption.description}
`).join('\n---\n')}

**Your Task:**
Provide a comprehensive security analysis with:

1. **Executive Summary** (2-3 sentences)
   - Overall security posture assessment
   - Key strengths and critical weaknesses

2. **Critical Vulnerabilities** (Top 3-5)
   - Identify the most serious security gaps
   - Explain potential business impact for each

3. **Strengths** (2-3 areas)
   - What the company is doing well
   - Positive practices worth maintaining

4. **Immediate Action Items** (Top 5 priorities)
   - Specific, actionable recommendations
   - Start with highest-risk issues first

5. **Long-term Improvements** (3-4 strategic initiatives)
   - Broader organizational changes needed
   - Process improvements and cultural shifts

6. **Compliance Considerations**
   - Relevant regulations (GDPR, CCPA, HIPAA, SOC 2, etc.)
   - Compliance gaps identified in the audit

**Format your response in clear markdown with headers and bullet points.**
**Be specific, actionable, and professional. Focus on practical business value.**
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate AI insights: ${error.message}`);
  }
};

/**
 * Generate security recommendations based on category scores
 * @param {Array} categoryScores - Array of category score objects
 * @returns {Promise<string>} AI-generated recommendations
 */
const generateCategoryRecommendations = async (categoryScores) => {
  try {
    const model = getModel();

    const prompt = `
You are a cybersecurity consultant. Based on the following security audit category scores, provide specific recommendations:

${categoryScores.map(cat => `
**${cat.category}**
- Score: ${cat.score}%
- Points: ${cat.earnedPoints}/${cat.maxPoints}
- Risk Level: ${cat.score >= 75 ? 'Low' : cat.score >= 50 ? 'Medium' : 'High'}
`).join('\n')}

For each category with a score below 75%, provide:
1. 2-3 specific, actionable recommendations
2. Estimated implementation difficulty (Easy/Medium/Hard)
3. Expected security improvement

Keep responses concise and practical.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
};

/**
 * Generate executive summary for audit report
 * @param {object} auditSummary - Summary data from audit
 * @returns {Promise<string>} Executive summary text
 */
const generateExecutiveSummary = async (auditSummary) => {
  try {
    const model = getModel();

    const prompt = `
Create a professional executive summary for this trade secret protection audit:

- Company: ${auditSummary.companyName}
- Overall Score: ${auditSummary.overallScore}%
- Risk Level: ${auditSummary.riskLevel}
- Date: ${new Date(auditSummary.completedAt).toLocaleDateString()}

Category Breakdown:
${auditSummary.categoryScores.map(cat => `- ${cat.category}: ${cat.score}%`).join('\n')}

Write a concise 3-4 paragraph executive summary that:
1. States the overall security posture
2. Highlights the strongest and weakest areas
3. Provides a clear recommendation (Continue monitoring / Immediate action needed / Critical attention required)

Use professional business language suitable for C-level executives.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate executive summary: ${error.message}`);
  }
};

/**
 * Test Gemini API connection
 * @returns {Promise<boolean>} True if connection successful
 */
const testConnection = async () => {
  try {
    const model = getModel();
    const result = await model.generateContent('Say "Connected" if you receive this message.');
    const response = await result.response;
    return response.text().toLowerCase().includes('connected');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};

module.exports = {
  analyzeAuditResponses,
  generateCategoryRecommendations,
  generateExecutiveSummary,
  testConnection
};
