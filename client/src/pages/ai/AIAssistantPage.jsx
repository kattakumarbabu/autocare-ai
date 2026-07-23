import { useState, useEffect, useRef } from 'react';
import { aiApi } from '../../api/aiApi';
import {
  Sparkles, Send, Bot, User, Loader2, Shield, Calendar,
  TrendingUp, AlertTriangle, Download, DollarSign, Fuel,
  CheckCircle2, Info, ArrowUpRight, FileText, Zap, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PROMPT_SUGGESTIONS = [
  'Why did my vehicle health score change?',
  'Predict my next maintenance schedule and cost',
  'What are my estimated costs for 3, 6, and 12 months?',
  'How can I improve my vehicle mileage?',
  'Are any of my documents, insurance, or PUC expiring?',
];

const AIAssistantPage = () => {
  const [insights,    setInsights]    = useState(null);
  const [messages,    setMessages]    = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your AutoCare AI Assistant. I have analyzed your vehicles, service logs, fuel consumption, expenses, and document expiries. Ask me anything about your garage!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input,       setInput]       = useState('');
  const [loadingMsg,  setLoadingMsg]  = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await aiApi.getInsights();
        setInsights(data.data);
      } catch {
        toast.error('Failed to load AI insights');
      } finally {
        setFetchingData(false);
      }
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMsg]);

  const handleSend = async (customPrompt = null) => {
    const promptToSend = (customPrompt || input).trim();
    if (!promptToSend || loadingMsg) return;

    if (!customPrompt) setInput('');

    const userMsg = {
      sender: 'user',
      text: promptToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoadingMsg(true);

    try {
      const { data } = await aiApi.chat(promptToSend);
      const botMsg = {
        sender: 'bot',
        text: data.data.reply,
        time: new Date(data.data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      toast.error('AI model error. Please try again.');
    } finally {
      setLoadingMsg(false);
    }
  };

  // Printable Monthly PDF Report Download
  const handleDownloadPDF = async () => {
    try {
      const { data } = await aiApi.getMonthlyReport();
      const report = data.data.report;

      const printWin = window.open('', '_blank');
      if (!printWin) {
        toast.error('Pop-up blocked. Allow pop-ups to print report.');
        return;
      }

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>AutoCare AI — Monthly Maintenance Report</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
              .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }
              .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
              .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
              .section { margin-bottom: 25px; }
              .section h2 { font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
              th { background: #f1f5f9; color: #334155; }
              .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 10px; font-size: 13px; }
              .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AutoCare AI — Monthly Maintenance Report</h1>
              <p>Report Period: ${report.month} | Generated for: ${report.user} | Date: ${new Date(report.generatedAt).toLocaleString()}</p>
            </div>

            <div class="section">
              <h2>Registered Vehicles & Health Overview</h2>
              <table>
                <thead>
                  <tr><th>Vehicle</th><th>Registration</th><th>Odometer</th><th>Health Score</th></tr>
                </thead>
                <tbody>
                  ${report.vehiclesSummary.map(v => `
                    <tr>
                      <td><b>${v.name}</b></td>
                      <td>${v.registration}</td>
                      <td>${v.odometer}</td>
                      <td><b>${v.healthScore}%</b></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>AI Cost Projections</h2>
              <div class="box">
                <p><b>Estimated 3-Month Maintenance Cost:</b> $${report.costProjections.threeMonths}</p>
                <p><b>Estimated 6-Month Maintenance Cost:</b> $${report.costProjections.sixMonths}</p>
                <p><b>Estimated 12-Month Maintenance Cost:</b> $${report.costProjections.twelveMonths}</p>
              </div>
            </div>

            <div class="section">
              <h2>Mileage Optimization Analysis</h2>
              <div class="box">
                <p><b>Average Fuel Economy:</b> ${report.mileageStats.avgMileage} km/L</p>
                <p><b>Best Peak Economy:</b> ${report.mileageStats.bestMileage} km/L</p>
                <p><b>AI Recommendations:</b></p>
                <ul>
                  ${report.mileageStats.tips.map(t => `<li>${t}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div class="footer">
              Generated automatically by AutoCare AI Maintenance Assistant Engine. Confidential document.
            </div>
          </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => printWin.print(), 500);
    } catch {
      toast.error('Failed to generate report');
    }
  };

  if (fetchingData) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  const { healthBreakdowns = [], estimatedCosts = {}, expiryWarnings = [], mileageStats = {} } = insights || {};

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-brand-400" />
              <h1 className="font-display font-bold text-3xl text-white">AI Maintenance Assistant</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Data-driven vehicle predictions, health score diagnostics, cost projections, and chat
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 self-start sm:self-auto"
            id="download-ai-report-btn"
          >
            <Download size={15} /> Download Monthly AI Report (PDF)
          </button>
        </div>

        {/* ── AI Insights Dashboard Grid ────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          {/* Card 1: 3-Month Cost Projection */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">3-Month Est. Cost</span>
              <DollarSign size={16} className="text-brand-400" />
            </div>
            <p className="font-display font-bold text-2xl text-white">${estimatedCosts.threeMonths || 0}</p>
            <p className="text-slate-500 text-[11px] mt-1">Next quarter projection</p>
          </div>

          {/* Card 2: 6-Month Cost Projection */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">6-Month Est. Cost</span>
              <DollarSign size={16} className="text-purple-400" />
            </div>
            <p className="font-display font-bold text-2xl text-purple-400">${estimatedCosts.sixMonths || 0}</p>
            <p className="text-slate-500 text-[11px] mt-1">Half-year projection</p>
          </div>

          {/* Card 3: 12-Month Cost Projection */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">12-Month Est. Cost</span>
              <DollarSign size={16} className="text-emerald-400" />
            </div>
            <p className="font-display font-bold text-2xl text-emerald-400">${estimatedCosts.twelveMonths || 0}</p>
            <p className="text-slate-500 text-[11px] mt-1">Annual budget estimate</p>
          </div>

          {/* Card 4: Fuel Economy Metric */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Avg Fuel Economy</span>
              <Fuel size={16} className="text-amber-400" />
            </div>
            <p className="font-display font-bold text-2xl text-amber-400">{mileageStats.avgMileage || 14.5} km/L</p>
            <p className="text-slate-500 text-[11px] mt-1">Peak best: {mileageStats.bestMileage || 18.2} km/L</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 animate-fade-in">

          {/* Left Column: Diagnostics & Expiry Alerts */}
          <div className="lg:col-span-5 space-y-6">

            {/* Health Score Explanations */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-3 text-base flex items-center gap-2">
                <Shield size={18} className="text-brand-400" /> Health Score Breakdown
              </h2>

              {healthBreakdowns.length === 0 ? (
                <p className="text-slate-400 text-xs">No vehicle health scores recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {healthBreakdowns.map((bh) => (
                    <div key={bh.vehicleId} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-xs font-semibold">{bh.name}</p>
                        <span className="text-xs font-bold text-emerald-400">{bh.healthScore}%</span>
                      </div>
                      <div className="space-y-1 mt-2">
                        {bh.deductions.map((d, i) => (
                          <p key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                            <Info size={12} className="text-brand-400 flex-shrink-0" /> {d}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expiry Alerts & Warnings */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-3 text-base flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" /> Compliance Expiry Alerts
              </h2>

              {expiryWarnings.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 size={16} /> All vehicle insurance, PUC, and documents are active!
                </div>
              ) : (
                <div className="space-y-2">
                  {expiryWarnings.map((w, idx) => (
                    <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs">
                      <p className="text-red-400 font-semibold">{w.title}</p>
                      <p className="text-slate-300 text-[11px] mt-0.5">{w.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Chat Window */}
          <div className="lg:col-span-7">
            <div className="glass-card p-4 h-[640px] flex flex-col">

              {/* Chat Window Header */}
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-gradient rounded-xl flex items-center justify-center text-white">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">AutoCare AI Chat</h3>
                    <p className="text-slate-400 text-[11px]">Powered by Gemini & Garage Database</p>
                  </div>
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.sender === 'bot' && (
                      <div className="w-7 h-7 bg-brand-500/20 border border-brand-500/30 rounded-lg flex items-center justify-center text-brand-400 flex-shrink-0 mt-1">
                        <Bot size={14} />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-brand-gradient text-white rounded-tr-none'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      <p>{m.text}</p>
                      <span className="block text-[10px] text-slate-400 text-right mt-1 font-mono">{m.time}</span>
                    </div>
                    {m.sender === 'user' && (
                      <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}

                {loadingMsg && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 p-3 rounded-xl w-fit">
                    <Loader2 size={14} className="animate-spin text-brand-400" />
                    <span>AutoCare AI is analyzing your database…</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Prompt Suggestion Chips */}
              <div className="p-2 overflow-x-auto flex items-center gap-1.5 border-t border-white/5 scrollbar-none">
                {PROMPT_SUGGESTIONS.map((ps, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(ps)}
                    className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                  >
                    {ps}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-2 pt-0 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask AutoCare AI about your vehicles, expenses, or maintenance…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="input-field flex-1 text-xs"
                  id="ai-chat-input"
                />
                <button type="submit" disabled={loadingMsg} className="btn-primary py-2 px-4 text-xs" id="send-ai-btn">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
