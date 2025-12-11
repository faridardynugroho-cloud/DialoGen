export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  category: string
  region?: string
}

export class OpenAIQuizService {
  private usedSentences: Set<string> = new Set()
  
  private readonly regions = [
    'Javanese (Jawa)',
    'Sundanese (Sunda)', 
    'Balinese (Bali)',
    'Minangkabau (Minang)',
    'Batak'
  ]

  resetUsedSentences() {
    this.usedSentences.clear()
  }

  // ✅ NEW: Shuffle options dan update correctAnswer
  private shuffleOptions(quiz: { question: string; options: string[]; correctAnswer: number }): { options: string[]; correctAnswer: number } {
    const correctOption = quiz.options[quiz.correctAnswer]
    
    // Shuffle array
    const shuffled = [...quiz.options]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    
    // Find new position of correct answer
    const newCorrectAnswer = shuffled.indexOf(correctOption || '')
    
    return {
      options: shuffled,
      correctAnswer: newCorrectAnswer
    }
  }

  // ✅ Generate quiz menggunakan OpenAI via proxy server
  async generateQuiz(category: string, region?: string, maxRetries: number = 3): Promise<QuizQuestion> {
    const prompt = this.buildPrompt(category, region, Array.from(this.usedSentences))

    try {
      console.log(`🤖 Generating quiz with OpenAI for category: ${category}, region: ${region || 'mixed'}`)
      
      const response = await fetch(`openai/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: "system", 
              content: "You are a helpful assistant specialized in Indonesian regional languages and culture. Always respond with valid JSON only, no markdown formatting or code blocks."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const completion = await response.json();
      const text = completion.choices?.[0]?.message?.content

      if (!text) {
        throw new Error('No text in response from OpenAI API')
      }
      
      console.log('📝 Raw response from OpenAI:', text.substring(0, 100) + '...')
      
      // Membersihkan response dari markdown code blocks
      let cleanedText = text.trim()
      
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '')
      }
      
      // Extract JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('❌ No JSON found in response:', cleanedText)
        throw new Error('No valid JSON found in response')
      }

      const quiz = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (!quiz.question || !quiz.options) {
        console.error('❌ Invalid quiz format:', quiz)
        throw new Error('Invalid quiz format from API - missing required fields')
      }

      // Validate options array
      if (!Array.isArray(quiz.options) || quiz.options.length !== 4) {
        console.error('❌ Invalid options array:', quiz.options)
        throw new Error('Options must be an array of 4 items')
      }

      // Validate correctAnswer
      if (typeof quiz.correctAnswer !== 'number' || quiz.correctAnswer < 0 || quiz.correctAnswer > 3) {
        console.warn('⚠️ Invalid correctAnswer, defaulting to 0')
        quiz.correctAnswer = 0
      }
      
      // ✅ SHUFFLE OPTIONS untuk random correct answer position
      const shuffled = this.shuffleOptions(quiz)
      quiz.options = shuffled.options
      quiz.correctAnswer = shuffled.correctAnswer
      
      console.log(`🔀 Shuffled options, correct answer now at index: ${quiz.correctAnswer}`)
      
      // Check for duplicate sentences
      const sentenceKey = quiz.question.toLowerCase().trim()
      if (this.usedSentences.has(sentenceKey)) {
        console.warn(`⚠️ Sentence "${quiz.question}" already used, regenerating...`)
        
        if (maxRetries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
          return this.generateQuiz(category, region, maxRetries - 1)
        } else {
          console.error('❌ Max retries reached for unique sentence generation')
          throw new Error('Max retries reached for unique sentence generation')
        }
      }
      
      // Add sentence to used set
      this.usedSentences.add(sentenceKey)
      
      console.log(`✅ Quiz generated successfully with OpenAI: "${quiz.question}"`)
      
      return {
        question: quiz.question,
        options: quiz.options,
        correctAnswer: quiz.correctAnswer,
        category,
        region: region || 'mixed'
      }
      
    } catch (error) {
      console.error('❌ Failed to generate quiz with OpenAI:', error)
      console.warn('🔄 Using fallback quiz instead')
      return this.getFallbackQuiz(category, region)
    }
  }

  // Generate multiple quizzes untuk game mode
  async generateGameQuizzes(category: string): Promise<QuizQuestion[]> {
    const quizzes: QuizQuestion[] = []
    
    const regionSequence: string[] = []
    this.regions.forEach(region => {
      regionSequence.push(region, region)
    })
    
    this.shuffleArray(regionSequence)
    
    console.log('📚 Generating 10 quizzes with region sequence:', regionSequence)
    
    for (let i = 0; i < regionSequence.length; i++) {
      const region = regionSequence[i]
      
      try {
        console.log(`[${i + 1}/10] Generating quiz for region: ${region}`)
        const quiz = await this.generateQuiz(category, region)
        quizzes.push(quiz)
        
        if (i < regionSequence.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`❌ Failed to generate quiz ${i + 1}:`, error)
        quizzes.push(this.getFallbackQuiz(category, region))
      }
    }
    
    console.log(`✅ Generated ${quizzes.length} quizzes successfully`)
    return quizzes
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j]!, array[i]!]
    }
  }

  private buildPrompt(category: string, region: string | undefined, usedSentences: string[]): string {
    let categoryDescription = ''
    
    switch (category) {
      case 'bahasa':
        categoryDescription = 'Focus on common vocabulary and phrases used in daily conversation'
        break
      case 'pakaian-adat':
        categoryDescription = 'Focus on traditional clothing, accessories, and ceremonial attire'
        break
      case 'rumah-adat':
        categoryDescription = 'Focus on traditional houses, architectural elements, and building components'
        break
      case 'semua-kategori':
        categoryDescription = 'Mix topics including language, traditional clothing, traditional houses, food, and culture'
        break
    }

    const regionInstruction = region 
      ? `\n\nCRITICAL: You MUST create the sentence ONLY in ${region} language. Do not mix or use other regional languages.`
      : '\n\nUse any Indonesian regional language (Javanese, Sundanese, Balinese, Minangkabau, or Batak).'

    const usedSentencesNote = usedSentences.length > 0 
      ? `\n\nIMPORTANT: DO NOT use these sentences (already used): ${usedSentences.slice(0, 5).join(', ')}... You MUST create a COMPLETELY DIFFERENT sentence.`
      : ''

    return `Generate a quiz question for learning Indonesian regional culture and language.

Category: ${category}
${categoryDescription}${regionInstruction}${usedSentencesNote}

STRICT REQUIREMENTS:
1. Create ONE SHORT sentence (MAXIMUM 5 WORDS) in the specified regional Indonesian language
2. The sentence must be SIMPLE, CLEAR, and COMMONLY USED
3. Provide exactly 4 multiple choice options for the meaning of THE ENTIRE SENTENCE in Bahasa Indonesia
4. Only ONE option must be correct (mark as correctAnswer: 0, 1, 2, or 3)
5. Make the question educational, culturally accurate, and interesting
6. The sentence MUST be UNIQUE and DIFFERENT from previously used sentences

CRITICAL: Return ONLY a valid JSON object with NO markdown formatting, NO code blocks, NO additional text.

Required JSON format:
{
  "question": "short sentence in regional language (max 5 words)",
  "options": ["correct translation", "wrong translation 1", "wrong translation 2", "wrong translation 3"],
  "correctAnswer": 0
}

Example for Javanese (SHORT sentence):
{
  "question": "Aku arep turu ing omah",
  "options": ["Saya akan tidur dirumah", "Saya akan makan dirumah", "Saya sedang bangun tidur", "Saya sudah pergi ke sekolah"],
  "correctAnswer": 0
}

Example for Sundanese (SHORT sentence):
{
  "question": "Urang hayang dahar",
  "options": ["Saya ingin makan", "Saya ingin minum", "Saya ingin tidur", "Saya ingin pergi"],
  "correctAnswer": 0
}

Generate the quiz now. Return ONLY the JSON object, nothing else.`
  }

  private getFallbackQuiz(category: string, preferredRegion?: string): QuizQuestion {
    const fallbackQuizzes: Record<string, QuizQuestion[]> = {
      'bahasa': [
        {
          question: "Aku arep turu",
          options: ["Saya akan tidur", "Saya akan makan", "Saya sedang bangun", "Saya sudah pergi"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Javanese (Jawa)'
        },
        {
          question: "Simbok lagi masak",
          options: ["Ibu sedang memasak", "Ibu sedang makan", "Ibu sedang tidur", "Ibu sedang pergi"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Javanese (Jawa)'
        },
        {
          question: "Bocah cilik dolan",
          options: ["Anak kecil bermain", "Anak kecil tidur", "Anak kecil makan", "Anak kecil berlari"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Javanese (Jawa)'
        },
        {
          question: "Urang hayang dahar",
          options: ["Saya ingin makan", "Saya ingin minum", "Saya ingin tidur", "Saya ingin pergi"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Sundanese (Sunda)'
        },
        {
          question: "Manehna keur ngadon",
          options: ["Dia sedang mencuci", "Dia sedang makan", "Dia sedang tidur", "Dia sedang bermain"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Sundanese (Sunda)'
        },
        {
          question: "Tiang sedek melajah",
          options: ["Saya sedang belajar", "Saya sedang bermain", "Saya sedang makan", "Saya sedang tidur"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Balinese (Bali)'
        },
        {
          question: "Ipun sedek ngajeng",
          options: ["Beliau sedang makan", "Beliau sedang minum", "Beliau sedang tidur", "Beliau sedang pergi"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Balinese (Bali)'
        },
        {
          question: "Ambo ka pasar",
          options: ["Saya ke pasar", "Saya ke rumah", "Saya ke sekolah", "Saya ke toko"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Minangkabau (Minang)'
        },
        {
          question: "Inyo mancaliak tampuruang",
          options: ["Dia melihat tebing", "Dia melihat langit", "Dia melihat laut", "Dia melihat gunung"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Minangkabau (Minang)'
        },
        {
          question: "Au mulak tu jabu",
          options: ["Saya pulang ke rumah", "Saya pergi ke sekolah", "Saya datang ke toko", "Saya tinggal di hotel"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Batak'
        },
        {
          question: "Ia mammaca buku",
          options: ["Dia membaca buku", "Dia menulis buku", "Dia membeli buku", "Dia meminjam buku"],
          correctAnswer: 0,
          category: 'bahasa',
          region: 'Batak'
        }
      ],
      'pakaian-adat': [
        {
          question: "Wong nganggo beskap",
          options: ["Orang memakai pakaian adat Jawa", "Orang memakai sarung", "Orang memakai peci", "Orang memakai celana"],
          correctAnswer: 0,
          category: 'pakaian-adat',
          region: 'Javanese (Jawa)'
        }
      ],
      'rumah-adat': [
        {
          question: "Omah joglo kuwi apik",
          options: ["Rumah joglo itu bagus", "Rumah joglo itu jelek", "Rumah joglo itu besar", "Rumah joglo itu kecil"],
          correctAnswer: 0,
          category: 'rumah-adat',
          region: 'Javanese (Jawa)'
        }
      ]
    }

    const categoryQuizzes = fallbackQuizzes[category] || fallbackQuizzes['bahasa'] || []
    
    if (categoryQuizzes.length === 0) {
      throw new Error(`No fallback quizzes available for category: ${category}`)
    }
    
    let availableQuizzes = categoryQuizzes.filter(
      q => !this.usedSentences.has(q.question.toLowerCase().trim())
    )
    
    if (preferredRegion && availableQuizzes.length > 0) {
      const regionMatches = availableQuizzes.filter(q => q.region === preferredRegion)
      if (regionMatches.length > 0) {
        availableQuizzes = regionMatches
      }
    }
    
    if (availableQuizzes.length === 0) {
      console.warn('⚠️ All fallback quizzes used, resetting...')
      this.usedSentences.clear()
      availableQuizzes = categoryQuizzes
    }
    
    const quiz = availableQuizzes[Math.floor(Math.random() * availableQuizzes.length)]!
    
    // ✅ SHUFFLE fallback quiz options too!
    const shuffled = this.shuffleOptions(quiz)
    
    const shuffledQuiz = {
      ...quiz,
      options: shuffled.options,
      correctAnswer: shuffled.correctAnswer
    }
    
    this.usedSentences.add(quiz.question.toLowerCase().trim())
    
    console.log(`📦 Using fallback quiz: "${quiz.question}" (correct at index ${shuffled.correctAnswer})`)
    return shuffledQuiz
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

// Singleton instance
let openaiService: OpenAIQuizService | null = null

export function useOpenAIQuiz(): OpenAIQuizService {
  if (!openaiService) {
    openaiService = new OpenAIQuizService()
  }
  return openaiService
}

// Backward compatibility exports
export { OpenAIQuizService as GeminiQuizService, useOpenAIQuiz as useGeminiQuiz }
export { OpenAIQuizService as DeepSeekQuizService, useOpenAIQuiz as useDeepSeekQuiz }