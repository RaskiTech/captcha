const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;

export class Recognizer {
  recognition: SpeechRecognition
  resultPromise: Promise<string>

  constructor() {
    const recognition = new SpeechRecognition()
    const speechRecognitionList = new SpeechGrammarList()

    recognition.grammars = speechRecognitionList
    recognition.continuous = false
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    this.recognition = recognition

    this.resultPromise = new Promise(() => "Error: Call start")
  }

  start() {
    this.recognition.start()

    this.resultPromise = new Promise<string>(
    (resolve) => {
      var resolved = false
      this.recognition.onresult = (event) => {
        resolve(event.results[0][0].transcript)
        resolved = true
      }
      // this.recognition.onerror = (ev) => {
      //   console.log("Errori")
      //   reject()
      // }
      this.recognition.onend = (event) => {
        if (!resolved)
        {
          resolve("")
          resolved = true
        }
      }
      // this.recognition.onnomatch = (ev) => {
      //   console.log("calling nomathc")
      //   resolve("")
      // }
    }) 
  }

  stop(): Promise<string> {
    
    this.recognition.stop()
    console.log(this.resultPromise)
    return this.resultPromise
  }
}
