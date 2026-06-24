export interface MetaData {
  title: string;
  source: string;
  category: string;
  target_level: string;
}

export interface VocabularyBlock {
  id: string;
  type: "word";
  item: string;
  part_of_speech: string;
  definition_en: string;
  contextual_sentence: string;
  academic_example: string;
}

export interface PhraseBlock {
  id: string;
  type: "phrase_collocation_idiom";
  item: string;
  definition_en: string;
  contextual_sentence: string;
  academic_example: string;
}

export interface SentencePattern {
  id: string;
  type: "pattern";
  pattern_structure: string;
  functional_purpose: string;
  contextual_sentence: string;
  academic_example: string;
}

export interface CorpusAnalysisResult {
  meta_data: MetaData;
  vocabulary_blocks: VocabularyBlock[];
  phrase_blocks: PhraseBlock[];
  sentence_patterns: SentencePattern[];
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "fill-in-the-blank" | "sentence-rewrite";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  target_item: string; // The vocabulary item, phrase, or sentence pattern tested
}

export interface QuizData {
  title: string;
  level: string;
  questions: QuizQuestion[];
}
