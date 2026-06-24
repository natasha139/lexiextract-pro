const MODEL = "qwen3.6-flash-2026-04-16";
const DASHSCOPE_API = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

async function callQwen(env, systemPrompt, userPrompt) {
  const key = env.DASHSCOPE_API_KEY;
  if (!key) throw new Error("DASHSCOPE_API_KEY is not configured.");

  const response = await fetch(DASHSCOPE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Qwen API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned from Qwen API.");
  return content;
}

async function handleAnalyze(request, env) {
  const { text, targetLevel, title, source, category, density } = await request.json();

  if (!text?.trim()) return errorResponse("Text content is required for analysis.", 400);

  const level = targetLevel || "IELTS";
  const docTitle = title || "Untitled Analysis Piece";
  const docSource = source || "User Provided Corpus";
  const docCategory = category || "Academic Text";
  const currentDensity = density || "standard";

  let wordCountDesc = "15 to 20 essential academic, thematic, or functional words";
  let phraseCountDesc = "10 to 14 high-quality phrasal verbs, idioms, native collocations, or formulaic chunks";
  let patternCountDesc = "6 to 9 elegant, advanced syntactic structures";

  if (currentDensity === "low") {
    wordCountDesc = "8 to 12 essential academic, thematic, or functional words";
    phraseCountDesc = "5 to 8 high-quality phrasal verbs, idioms, or native collocations";
    patternCountDesc = "3 to 5 elegant, advanced syntactic structures";
  } else if (currentDensity === "high") {
    wordCountDesc = "35 to 40 essential academic, thematic, or functional words";
    phraseCountDesc = "20 to 25 high-quality phrasal verbs, idioms, native collocations, or formulaic chunks";
    patternCountDesc = "12 to 15 advanced syntactic structures";
  }

  const systemPrompt = "You are an elite academic English corpus linguist. Extract precise pedagogical lexical items and grammar patterns. Output only valid JSON, no markdown fences.";

  const userPrompt = `Analyze the following academic/literary text as an expert corpus linguist and curriculum designer for high-stakes exams (KET, PET, FCE, CAE, IELTS, TOEFL, GRE).

Level: ${level}. Extract items core to ${level} or slightly challenging for this tier.
- Words: Extract ${wordCountDesc}.
- Phrases: Extract ${phraseCountDesc}.
- Patterns: Extract ${patternCountDesc}.

Constraints:
1. "contextual_sentence" must be the exact sentence from the source text.
2. "academic_example" must be a fresh, authentic example sentence you generate.
3. part_of_speech must be lowercase English (noun, verb, adjective, adverb, etc.).

Return JSON:
{
  "meta_data": { "title": string, "source": string, "category": string, "target_level": string },
  "vocabulary_blocks": [{ "id": string, "type": "word", "item": string, "part_of_speech": string, "definition_en": string, "contextual_sentence": string, "academic_example": string }],
  "phrase_blocks": [{ "id": string, "type": "phrase_collocation_idiom", "item": string, "definition_en": string, "contextual_sentence": string, "academic_example": string }],
  "sentence_patterns": [{ "id": string, "type": "pattern", "pattern_structure": string, "functional_purpose": string, "contextual_sentence": string, "academic_example": string }]
}

Text:
"""
${text}
"""`;

  const resultText = await callQwen(env, systemPrompt, userPrompt);
  const runDetails = JSON.parse(resultText);

  if (!runDetails.meta_data.title) runDetails.meta_data.title = docTitle;
  if (!runDetails.meta_data.source) runDetails.meta_data.source = docSource;
  if (!runDetails.meta_data.category) runDetails.meta_data.category = docCategory;
  runDetails.meta_data.target_level = level;

  return jsonResponse(runDetails);
}

async function handleQuiz(request, env) {
  const { corpusData, spacedRepPriorityItems } = await request.json();

  if (!corpusData || (!corpusData.vocabulary_blocks?.length && !corpusData.phrase_blocks?.length && !corpusData.sentence_patterns?.length)) {
    return errorResponse("Corpus analysis data is required to generate a practice quiz.", 400);
  }

  const level = corpusData.meta_data?.target_level || "IELTS";

  let spacedRepFocusInstruction = "";
  if (Array.isArray(spacedRepPriorityItems) && spacedRepPriorityItems.length > 0) {
    spacedRepFocusInstruction = `\n\nCRITICAL: Prioritize at least 2-3 questions targeting these items the student struggles with:\n${JSON.stringify(spacedRepPriorityItems)}`;
  }

  const systemPrompt = "You are an elite educational assessment scientist. Create high-fidelity exam questions matching British & American assessment standards. Output only valid JSON, no markdown fences.";

  const userPrompt = `Generate a professional 5-question curriculum practice quiz for level: ${level}.${spacedRepFocusInstruction}

Input items:
- Vocabulary: ${JSON.stringify(corpusData.vocabulary_blocks?.map(v => v.item))}
- Phrases: ${JSON.stringify(corpusData.phrase_blocks?.map(p => p.item))}
- Sentence Patterns: ${JSON.stringify(corpusData.sentence_patterns?.map(s => s.pattern_structure))}

Mix question types: "multiple-choice", "fill-in-the-blank", "sentence-rewrite".

Return JSON:
{
  "title": string,
  "level": "${level}",
  "questions": [{ "id": string, "type": string, "question": string, "options": [string], "correctAnswer": string, "explanation": string, "target_item": string }]
}`;

  const resultText = await callQwen(env, systemPrompt, userPrompt);
  return jsonResponse(JSON.parse(resultText));
}

async function handleExplainItem(request, env) {
  const { item, type, partOfSpeech, definition, sentence } = await request.json();

  if (!item) return errorResponse("Item name/structure is required.", 400);

  const systemPrompt = "You are an elite academic English grammarian and ESL mentor. Return valid JSON only, no markdown fences.";

  const userPrompt = `Explain the following linguistic item clearly for advanced English learners (IELTS/CAE/GRE level).

- Name/Structure: "${item}"
- Type: ${type || "unknown"}
- Part of Speech: ${partOfSpeech || "N/A"}
- Definition: "${definition || ""}"
- Example: "${sentence || ""}"

Return JSON:
{
  "nuance_explanation": string,
  "common_pitfalls": [string, string, string],
  "collocation_suggestions": [string, string, string, string],
  "tip": string
}`;

  const resultText = await callQwen(env, systemPrompt, userPrompt);
  return jsonResponse(JSON.parse(resultText));
}

async function handleWritingFeedback(request, env) {
  const { paragraph, targetItems, targetLevel } = await request.json();

  if (!paragraph?.trim()) return errorResponse("Writing paragraph is required.", 400);

  const level = targetLevel || "IELTS";

  const systemPrompt = "You are an elite academic English writing assessor. Grade with professional transparency. Return valid JSON only, no markdown fences.";

  const userPrompt = `Analyze this student paragraph under ${level} standards (grammatical range, lexical resource, coherence).

Paragraph:
"""
${paragraph}
"""

Target items the student was asked to use:
${JSON.stringify(targetItems || [])}

Return JSON:
{
  "score_out_of_10": integer,
  "cefr_equivalent": string,
  "target_items_analysis": [{ "item": string, "detected": boolean, "is_correct": boolean, "usage_feedback": string }],
  "corrections": [{ "original": string, "suggestion": string, "explanation": string }],
  "strengths": [string, string],
  "polished_version": string
}`;

  const resultText = await callQwen(env, systemPrompt, userPrompt);
  return jsonResponse(JSON.parse(resultText));
}

async function handleArticleRewrite(request, env) {
  const { topic, bandScore, selectedVocabulary, selectedPhrases, selectedPatterns } = await request.json();

  if (!topic?.trim()) return errorResponse("An essay topic is required.", 400);

  const bandStr = bandScore || "8.0";

  const systemPrompt = "You are a Lead Columnist at The Economist and a Principal IELTS Writing Examiner. Return valid JSON only, no markdown fences.";

  const userPrompt = `Write a high-caliber essay on: "${topic}" targeting Band ${bandStr}.
Tone: The Economist (intellectually rigorous, analytical, witty).

Integrate these selected elements:
- Vocabulary: ${JSON.stringify(selectedVocabulary || [])}
- Phrases: ${JSON.stringify(selectedPhrases || [])}
- Sentence Patterns: ${JSON.stringify(selectedPatterns || [])}

Return JSON:
{
  "headline": string,
  "introduction": { "text": string, "analysis_zh": string },
  "body_paragraphs": [{ "text": string, "para_type": string, "analysis_zh": string }],
  "conclusion": { "text": string, "analysis_zh": string },
  "items_used_checklist": [{ "item": string, "sentence_where_used": string, "usage_analysis_zh": string }],
  "stylistic_economist_analysis_zh": string
}`;

  const resultText = await callQwen(env, systemPrompt, userPrompt);
  return jsonResponse(JSON.parse(resultText));
}

async function handleDictionaryLookup(request, env) {
  const { word } = await request.json();

  if (!word?.trim()) return errorResponse("A word is required.", 400);

  const systemPrompt = "You are an elite academic English lexicographer. Return valid JSON only, no markdown fences.";

  const userPrompt = `Comprehensive academic dictionary lookup for: "${word.trim()}"

Return JSON:
{
  "word": string,
  "ipa": string,
  "part_of_speech": string,
  "definition": string,
  "synonyms": [{ "word": string, "nuance": string }],
  "examples": [string, string, string]
}`;

  const resultText = await callQwen(env, systemPrompt, userPrompt);
  return jsonResponse(JSON.parse(resultText));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "POST") {
        if (path === "/api/analyze") return await handleAnalyze(request, env);
        if (path === "/api/quiz") return await handleQuiz(request, env);
        if (path === "/api/explain-item") return await handleExplainItem(request, env);
        if (path === "/api/writing-feedback") return await handleWritingFeedback(request, env);
        if (path === "/api/article-rewrite") return await handleArticleRewrite(request, env);
        if (path === "/api/dictionary-lookup") return await handleDictionaryLookup(request, env);
      }
      return errorResponse("Not found", 404);
    } catch (err) {
      console.error(err);
      return errorResponse(err.message || "Internal server error");
    }
  },
};
