# 🤖 Gemini AI Integration Guide

## 📦 Installation & Setup

### Step 1: Install Dependencies

Run this command in your backend directory:

```bash
cd backend
npm install @google/generative-ai
```

### Step 2: Get Your Gemini API Key

1. Visit **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the API key (starts with `AIza...`)

### Step 3: Configure Environment Variable

Open `backend/.env` and replace the placeholder:

```env
GEMINI_API_KEY=your-actual-api-key-here
```

Example:
```env
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ✅ Test the Integration

Run the test script to verify everything works:

```bash
cd backend
node test-gemini.js
```

**Expected Output:**
```
🔍 Testing Gemini API Integration...
API Key: AIzaSyDxxx...

📡 Test 1: Connection Test
✅ SUCCESS: Gemini API is connected!

📊 Test 2: Sample Audit Analysis
Generating AI insights for a sample audit...
✅ SUCCESS: AI Insights Generated!
```

---

## 🎯 Usage Examples

### Example 1: Generate AI Insights for an Audit

Add this controller function to `auditController.js`:

```javascript
const { analyzeAuditResponses } = require('../services/gemini');

const generateAIInsights = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    
    if (!audit) {
      return res.status(404).json({ success: false, error: 'Audit not found' });
    }

    const auditData = {
      companyName: audit.companyName,
      overallScore: audit.percentageScore,
      riskLevel: audit.riskLevel,
      categoryScores: audit.categoryScores,
      answers: audit.responses.map(r => ({
        questionText: r.questionText,
        category: r.category,
        selectedOption: r.selectedOption
      }))
    };

    const insights = await analyzeAuditResponses(auditData);

    res.status(200).json({ success: true, data: { insights } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Example 2: Auto-Generate Insights on Audit Submission

Modify your `submitAudit` function in `auditController.js`:

```javascript
// After creating audit...
const audit = await Audit.create({
  // ... existing fields
});

// Generate AI insights (optional)
if (req.body.generateAIInsights === true) {
  try {
    const insights = await analyzeAuditResponses({
      companyName: audit.companyName,
      overallScore: audit.percentageScore,
      riskLevel: audit.riskLevel,
      categoryScores: audit.categoryScores,
      answers: audit.responses
    });

    audit.aiInsights = insights;
    await audit.save();
  } catch (error) {
    console.error('AI generation failed:', error);
    // Don't fail audit submission if AI fails
  }
}
```

### Example 3: Add Routes

Add to `backend/routes/auditRoutes.js`:

```javascript
const { generateAIInsights } = require('../controllers/auditController');

// Generate AI insights for existing audit
router.post('/audits/:id/ai-insights', protect, generateAIInsights);
```

---

## 📝 Available Functions

### `analyzeAuditResponses(auditData)`
Generate comprehensive security analysis with:
- Executive summary
- Critical vulnerabilities
- Strengths
- Action items
- Long-term improvements
- Compliance considerations

### `generateCategoryRecommendations(categoryScores)`
Get specific recommendations for weak categories.

### `generateExecutiveSummary(auditSummary)`
Create professional executive summary for C-level.

### `testConnection()`
Verify Gemini API is working.

---

## 🔧 Model Configuration

Current model: **gemini-1.5-pro**

To change the model, edit `services/gemini.js`:

```javascript
const getModel = (modelName = 'gemini-1.5-pro') => {
  return genAI.getGenerativeModel({ model: modelName });
};
```

Available models:
- `gemini-1.5-pro` (Recommended - best quality)
- `gemini-1.5-flash` (Faster, lower cost)
- `gemini-2.0-flash-exp` (Experimental)

---

## 🚨 Error Handling

Common errors and solutions:

### ❌ "GEMINI_API_KEY not found"
**Solution:** Add your API key to `.env` file

### ❌ "API key not valid"
**Solution:** Generate a new key at https://aistudio.google.com/app/apikey

### ❌ "Failed to generate AI insights"
**Solution:** 
- Check internet connection
- Verify API key is valid
- Check Google AI Studio for quota limits

---

## 💰 Pricing & Quotas

**Gemini 1.5 Pro (Free Tier):**
- 2 requests per minute
- 1,500 requests per day
- Free up to 50 requests/day for extended usage

**Paid Tier:**
- $7.00 / 1M input tokens
- $21.00 / 1M output tokens

Learn more: https://ai.google.dev/pricing

---

## 📚 Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Node.js SDK Reference](https://github.com/google/generative-ai-js)

---

## ✨ Next Steps

1. ✅ Install package: `npm install @google/generative-ai`
2. ✅ Add API key to `.env`
3. ✅ Run test: `node test-gemini.js`
4. 📝 Review examples in `examples/gemini-usage-examples.js`
5. 🚀 Integrate into your controllers

---

**Need help?** Check the example file at `backend/examples/gemini-usage-examples.js` for complete implementation examples.
