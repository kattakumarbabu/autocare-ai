import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, X, Bot, Sparkles, Send } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import toast from 'react-hot-toast';

const VoiceAssistantModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse]     = useState('Hi! Press the microphone or type to speak to AutoCare AI Voice Assistant.');
  const [speaking, setSpeaking]     = useState(false);
  const [loading, setLoading]       = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setListening(true);
        setTranscript('Listening…');
      };

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setTranscript(text);
        setListening(false);
        handleVoiceCommand(text);
      };

      rec.onerror = () => {
        setListening(false);
        toast.error('Voice input error. Try typing your command.');
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = async (cmd) => {
    if (!cmd || !cmd.trim()) return;

    setLoading(true);
    const q = cmd.toLowerCase();

    let reply = '';
    let targetNav = null;

    if (q.includes('next service') || q.includes('when is my service')) {
      reply = 'Your next scheduled service is tracked in your Reminders and Digital Twin. Let me open your Appointments for booking or rescheduling.';
      targetNav = '/appointments';
    } else if (q.includes('fuel')) {
      reply = 'Opening your Fuel & Mileage Tracker. You can review your average kilometer per liter and total monthly fuel spend.';
      targetNav = '/fuel';
    } else if (q.includes('expense') || q.includes('expenses')) {
      reply = 'Navigating to Expense Analytics to view your monthly maintenance and fuel spend breakdown.';
      targetNav = '/expenses';
    } else if (q.includes('report') || q.includes('generate report')) {
      reply = 'Opening your AI Assistant Report generator. You can download your Monthly AI Report or Performance Audit as PDF.';
      targetNav = '/ai-assistant';
    } else if (q.includes('book service') || q.includes('book appointment')) {
      reply = 'Opening Service Appointment Booking. Select your vehicle, mechanic, date, and time slot.';
      targetNav = '/appointments/book';
    } else {
      try {
        const { data } = await aiApi.chat(cmd);
        reply = data.data.reply;
      } catch {
        reply = 'I have processed your query. Let me open your AI Assistant.';
        targetNav = '/ai-assistant';
      }
    }

    setResponse(reply);
    speakText(reply);
    setLoading(false);

    if (targetNav) {
      setTimeout(() => {
        navigate(targetNav);
        onClose();
      }, 2500);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error('Voice Recognition is not supported by your browser. Type your command below.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            listening ? 'bg-red-500/20 text-red-400 ring-8 ring-red-500/10 animate-pulse' : 'bg-brand-500/20 text-brand-400 ring-4 ring-brand-500/10'
          }`}>
            <Bot size={36} />
          </div>

          <div>
            <h3 className="font-display font-bold text-xl text-white">AutoCare Voice Assistant</h3>
            <p className="text-slate-400 text-xs mt-1">Speak commands or ask questions aloud</p>
          </div>

          {/* Response card */}
          <div className="w-full p-4 bg-surface-950 rounded-xl border border-white/10 text-xs text-slate-200 min-h-[90px] flex items-center justify-center">
            {loading ? (
              <span className="text-slate-400 flex items-center gap-2">
                <Sparkles size={14} className="animate-spin text-brand-400" /> Processing voice command…
              </span>
            ) : (
              <p>{response}</p>
            )}
          </div>

          {transcript && (
            <p className="text-xs text-brand-300 font-mono italic">"{transcript}"</p>
          )}

          {/* Big Microphone Action Button */}
          <button
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-glow ${
              listening ? 'bg-red-500 shadow-red-500/50 scale-110' : 'bg-brand-gradient hover:scale-105'
            }`}
            id="voice-mic-btn"
          >
            {listening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          {/* Quick Voice Prompt Chips */}
          <div className="w-full flex flex-wrap gap-1.5 justify-center pt-2">
            {['When is my next service?', 'How much fuel did I spend?', 'Show my expenses', 'Generate report', 'Book service'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setTranscript(chip);
                  handleVoiceCommand(chip);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
              >
                "{chip}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;
