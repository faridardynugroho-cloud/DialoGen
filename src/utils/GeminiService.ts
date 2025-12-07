import { GoogleGenAI } from "@google/genai";

export interface QuizQuestion {
  question: string
  targetWord: string
  options: string[]
  correctAnswer: number
  fullTranslation: string
  category: string
  region?: string // ✅ Tambahkan region tracking
}

export class GeminiQuizService {
  private ai: GoogleGenAI
  private usedWords: Set<string> = new Set()
  
  // ✅ Daftar bahasa daerah Indonesia
  private readonly regions = [
    'Javanese (Jawa)',
    'Sundanese (Sunda)', 
    'Balinese (Bali)',
    'Minangkabau (Minang)',
    'Batak'
  ]

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey })
  }

  resetUsedWords() {
    this.usedWords.clear()
  }

  // ✅ Generate quiz dengan region spesifik
  async generateQuiz(category: string, region?: string, maxRetries: number = 3): Promise<QuizQuestion> {
    const prompt = this.buildPrompt(category, region, Array.from(this.usedWords))

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      })

      const text = response.text

      if (!text) {
        throw new Error('No text in response')
      }
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const quiz = JSON.parse(jsonMatch[0])
      
      // ✅ Cek apakah kata sudah pernah dipakai
      if (this.usedWords.has(quiz.targetWord.toLowerCase())) {
        console.warn(`Word "${quiz.targetWord}" already used, regenerating...`)
        
        if (maxRetries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
          return this.generateQuiz(category, region, maxRetries - 1)
        } else {
          throw new Error('Max retries reached for unique word generation')
        }
      }
      
      // ✅ Simpan kata yang sudah dipakai
      this.usedWords.add(quiz.targetWord.toLowerCase())
      
      return {
        ...quiz,
        category,
        region: region || 'mixed'
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      return this.getFallbackQuiz(category)
    }
  }

  // ✅ Generate 10 soal dengan 5 bahasa (2 soal per bahasa, acak)
  async generateGameQuizzes(category: string): Promise<QuizQuestion[]> {
    const quizzes: QuizQuestion[] = []
    
    // Buat array dengan 2 soal per region
    const regionSequence: string[] = []
    this.regions.forEach(region => {
      regionSequence.push(region, region) // 2x per region = 10 total
    })
    
    // ✅ Shuffle/acak urutan region
    this.shuffleArray(regionSequence)
    
    console.log('📚 Generating quizzes with region sequence:', regionSequence)
    
    // Generate quiz untuk setiap region
    for (let i = 0; i < regionSequence.length; i++) {
      const region = regionSequence[i]
      
      try {
        console.log(`Generating quiz ${i + 1}/10 for region: ${region}`)
        const quiz = await this.generateQuiz(category, region)
        quizzes.push(quiz)
        
        // Add delay to avoid rate limiting
        if (i < regionSequence.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Failed to generate quiz ${i + 1}:`, error)
        quizzes.push(this.getFallbackQuiz(category))
      }
    }
    
    return quizzes
  }

  // ✅ Shuffle array helper
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j]!, array[i]!]
    }
  }

  private buildPrompt(category: string, region: string | undefined, usedWords: string[]): string {
    let categoryDescription = ''
    
    switch (category) {
      case 'bahasa':
        categoryDescription = 'Focus on common vocabulary and phrases'
        break
      case 'pakaian-adat':
        categoryDescription = 'Focus on traditional clothing and accessories'
        break
      case 'rumah-adat':
        categoryDescription = 'Focus on traditional houses and architectural elements'
        break
      case 'semua-kategori':
        categoryDescription = 'Mix topics including language, traditional clothing, traditional houses, food, and culture'
        break
    }

    // ✅ Region-specific instruction
    const regionInstruction = region 
      ? `\n\nIMPORTANT: You MUST create the sentence in ${region} language ONLY. Do not use other regional languages.`
      : '\n\nUse any Indonesian regional language (Javanese, Sundanese, Balinese, Minang, or Batak).'

    const usedWordsNote = usedWords.length > 0 
      ? `\n\nDO NOT use these words as targetWord (already used): ${usedWords.join(', ')}. You MUST use a DIFFERENT word.`
      : ''

    return `Generate a quiz question for learning Indonesian regional culture and language.

Category: ${category}
${categoryDescription}${regionInstruction}${usedWordsNote}

Requirements:
1. Create a sentence in the specified regional Indonesian language
2. Select ONE important word from that sentence to be the quiz target
3. The targetWord MUST be UNIQUE and DIFFERENT from previously used words
4. Provide 4 multiple choice options for the meaning of the target word in Bahasa Indonesia
5. Make sure only ONE option is correct
6. Provide the full Indonesian translation of the entire sentence
7. Make the question educational and interesting

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{
  "question": "complete sentence in regional language",
  "targetWord": "the specific word to guess (MUST BE UNIQUE)",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": 0,
  "fullTranslation": "full Indonesian translation of the sentence"
}

Example for Javanese:
{
  "question": "Bapak lagi maca koran ning teras omah",
  "targetWord": "maca",
  "options": ["membaca", "menulis", "mendengar", "berbicara"],
  "correctAnswer": 0,
  "fullTranslation": "Bapak sedang membaca koran di teras rumah"
}

Generate a NEW question now with a UNIQUE targetWord:`
  }

  private getFallbackQuiz(category: string): QuizQuestion {
    const fallbackQuizzes: Record<string, QuizQuestion[]> = {
      'bahasa': [
        {
          question: "Aku arep turu ing kamar",
          targetWord: "turu",
          options: ["tidur", "bangun", "makan", "minum"],
          correctAnswer: 0,
          fullTranslation: "Saya akan tidur di kamar",
          category: 'bahasa',
          region: 'Javanese'
        },
        {
          question: "Simbok lagi masak ing pawon",
          targetWord: "masak",
          options: ["memasak", "mencuci", "menyapu", "mengepel"],
          correctAnswer: 0,
          fullTranslation: "Ibu sedang memasak di dapur",
          category: 'bahasa',
          region: 'Javanese'
        },
        {
          question: "Urang hayang dahar heula",
          targetWord: "dahar",
          options: ["makan", "minum", "tidur", "pergi"],
          correctAnswer: 0,
          fullTranslation: "Saya ingin makan dulu",
          category: 'bahasa',
          region: 'Sundanese'
        },
        {
          question: "Tiang sedek melajah basa Bali",
          targetWord: "melajah",
          options: ["belajar", "bermain", "bekerja", "berlari"],
          correctAnswer: 0,
          fullTranslation: "Saya sedang belajar bahasa Bali",
          category: 'bahasa',
          region: 'Balinese'
        }
      ],
      'pakaian-adat': [
        {
          question: "Wong lanang nganggo beskap lan blangkon nalika kondangan",
          targetWord: "beskap",
          options: ["pakaian adat Jawa untuk pria", "sarung", "peci", "celana"],
          correctAnswer: 0,
          fullTranslation: "Pria memakai pakaian adat dan penutup kepala saat menghadiri acara",
          category: 'pakaian-adat',
          region: 'Javanese'
        }
      ],
      'rumah-adat': [
        {
          question: "Omah joglo duwe saka guru papat",
          targetWord: "saka guru",
          options: ["tiang utama", "atap", "dinding", "pintu"],
          correctAnswer: 0,
          fullTranslation: "Rumah joglo memiliki empat tiang utama",
          category: 'rumah-adat',
          region: 'Javanese'
        }
      ]
    }

    const categoryQuizzes = fallbackQuizzes[category] || fallbackQuizzes['bahasa'] || []
    if (categoryQuizzes.length === 0) {
      throw new Error(`No fallback quizzes available for category: ${category}`)
    }
    
    const availableQuizzes = categoryQuizzes.filter(
      q => !this.usedWords.has(q.targetWord.toLowerCase())
    )
    
    if (availableQuizzes.length === 0) {
      const quiz = categoryQuizzes[Math.floor(Math.random() * categoryQuizzes.length)]!
      return quiz
    }
    
    const quiz = availableQuizzes[Math.floor(Math.random() * availableQuizzes.length)]!
    this.usedWords.add(quiz.targetWord.toLowerCase())
    return quiz
  }

  async generateBatchQuiz(category: string, count: number = 10): Promise<QuizQuestion[]> {
    const quizzes: QuizQuestion[] = []
    
    for (let i = 0; i < count; i++) {
      try {
        const quiz = await this.generateQuiz(category)
        quizzes.push(quiz)
        
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Failed to generate quiz ${i + 1}:`, error)
        quizzes.push(this.getFallbackQuiz(category))
      }
    }
    
    return quizzes
  }
}

let geminiService: GeminiQuizService | null = null

export function useGeminiQuiz(apiKey?: string): GeminiQuizService {
  if (!geminiService) {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || ''
    if (!key) {
      console.warn('Gemini API key not found, using fallback quizzes')
    }
    geminiService = new GeminiQuizService(key)
  }
  return geminiService
}