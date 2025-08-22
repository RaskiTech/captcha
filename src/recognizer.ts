const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;

export class Recognizer {
  recognition: SpeechRecognition

  constructor() {
    const recognition = new SpeechRecognition()
    const speechRecognitionList = new SpeechGrammarList()

    recognition.grammars = speechRecognitionList
    recognition.continuous = false
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    this.recognition = recognition
  }

  start() {
    this.recognition.start()
  }

  stop(): Promise<string> {
    
    const promise = new Promise<string>((resolve) => {
      this.recognition.onresult = (event) => {
        resolve(event.results[0][0].transcript)
      }
    })
    this.recognition.stop()

    return promise
  }
}
