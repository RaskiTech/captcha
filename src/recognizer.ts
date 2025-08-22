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

    this.recognition.onresult = (event) => {
      console.log(event.results)
    }
  }

  start() {
    this.recognition.start()
  }

  stop() {
    this.recognition.stop()
  }
}
