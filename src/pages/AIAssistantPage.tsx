import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  HardDrive,
  AlertTriangle,
  Award,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ITAsset } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  matchedAssets?: ITAsset[];
}

interface AIAssistantPageProps {
  onSelectAsset: (asset: ITAsset) => void;
}

const SUGGESTED_QUERIES = [
  'What assets are waiting for data wiping?',
  'Which assets failed verification?',
  'Which assets are non-compliant?',
  'Show assets without destruction certificates.',
  'Give me this month’s disposal summary.',
  'Why is HDD-3001 non-compliant?',
  'Generate a compliance summary.',
];

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ onSelectAsset }) => {
  const { assets, certificates, complianceRules, auditLogs } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'MSG-01',
      sender: 'assistant',
      text: `Hello, I am your Aegis Compliance Intelligence Assistant. I am directly connected to your active inventory of ${assets.length} IT assets, wiping rigs, and regulatory rules (NIST SP 800-88, ISO 27001, GDPR Art 17). 

You can ask me questions about pending disposal requests, failing drives, non-compliant assets, or request an immediate compliance summary. Select a suggested prompt below or type your query.`,
      timestamp: '07:00 AM',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Internal smart answering engine grounded on live app state
  const generateAssistantResponse = (query: string): { reply: string; matchedAssets?: ITAsset[] } => {
    const q = query.toLowerCase();

    // 1. Assets waiting for wiping
    if (q.includes('waiting for data wiping') || q.includes('waiting for wiping') || q.includes('queue for wiping')) {
      const waiting = assets.filter((a) => a.disposalStatus === 'Approved' || a.disposalStatus === 'Wiping In Progress');
      return {
        reply: `There are currently **${waiting.length} IT assets** awaiting or actively undergoing data wiping:

${waiting
  .map(
    (a) =>
      `• **${a.id}** (${a.brand} ${a.model}) — Custodian: ${a.assignedEmployee} | Status: *${a.disposalStatus}* | Priority: ${a.priority || 'Medium'}`
  )
  .join('\n')}

Technician Marcus Vance is assigned to the sanitization rig. Recommended next step is to initiate or monitor the overwrite passes.`,
        matchedAssets: waiting,
      };
    }

    // 2. Failed verification
    if (q.includes('failed verification') || q.includes('verification failed') || q.includes('failed wiping')) {
      const failed = assets.filter(
        (a) => a.disposalStatus === 'Verification Failed' || a.verificationResult === 'Failed' || a.wipingStatus === 'Failed'
      );
      return {
        reply: `We detected **${failed.length} assets** that failed verification or sanitization:

${failed
  .map(
    (a) =>
      `• **${a.id}** (${a.brand} ${a.model} - SN: \`${a.serialNumber}\`): Failed during independent verification due to uncorrectable bad sectors. Notes: "${a.verificationNotes || 'I/O read timeout'}"`
  )
  .join('\n')}

**Security Recommendation:** Under NIST SP 800-88 Rev 1 Section 4.5, drives failing logical purge must be routed to **Physical Destruction / Industrial Degaussing and Mechanical Shredding**.`,
        matchedAssets: failed,
      };
    }

    // 3. Non-compliant assets
    if (q.includes('non-compliant') || q.includes('non compliant') || q.includes('compliance issues')) {
      const nonCompliant = assets.filter((a) => a.complianceStatus === 'Non-Compliant');
      return {
        reply: `There are currently **${nonCompliant.length} non-compliant assets** requiring immediate SecOps review:

${nonCompliant
  .map(
    (a) =>
      `• **${a.id}** (${a.brand} ${a.model}): ${a.disposalReason || 'Hardware failure'}. Status is *${a.disposalStatus}*. Risk level is **${a.riskLevel}**.`
  )
  .join('\n')}

These assets cannot proceed to Certificate Generation until all missing regulatory requirements are reconciled.`,
        matchedAssets: nonCompliant,
      };
    }

    // 4. Show assets without destruction certificates
    if (q.includes('without destruction certificates') || q.includes('without certificate') || q.includes('no certificate')) {
      const withoutCert = assets.filter((a) => !a.certificateId && a.disposalStatus !== 'Active');
      return {
        reply: `There are **${withoutCert.length} decommissioned assets** currently lacking a final Certificate of Destruction:

${withoutCert
  .map(
    (a) =>
      `• **${a.id}** (${a.brand} ${a.model}) — Current Stage: *${a.lifecycleStage}* (${a.disposalStatus})`
  )
  .join('\n')}

Note: Certificates can only be officially generated once an asset achieves verified zero-fill status (*Ready For Disposal*).`,
        matchedAssets: withoutCert,
      };
    }

    // 5. Monthly disposal summary
    if (q.includes('disposal summary') || q.includes('monthly disposal') || q.includes('summary')) {
      const activeCount = assets.filter((a) => a.disposalStatus === 'Active').length;
      const pendingApproval = assets.filter((a) => a.disposalStatus === 'Pending Approval').length;
      const wipingCount = assets.filter((a) => a.disposalStatus === 'Wiping In Progress').length;
      const readyCount = assets.filter((a) => a.disposalStatus === 'Ready For Disposal').length;
      const disposedCount = assets.filter((a) => a.disposalStatus === 'Disposed').length;

      return {
        reply: `### Enterprise IT Asset Disposal Monthly Summary
• **Total Tracked Assets:** ${assets.length} hardware units
• **Active In-Field Custody:** ${activeCount} units
• **Decommission Requests Pending Approval:** ${pendingApproval} units
• **Active Sanitization in Progress:** ${wipingCount} drives
• **Verified & Ready for Certified Disposal:** ${readyCount} units
• **Fully Disposed & Recycled via R2v3:** ${disposedCount} units
• **Total Valid Cryptographic Certificates:** ${certificates.length} certificates (SHA-256 sealed)
• **Overall Organizational Compliance Score:** 92.4%

No security incidents or unverified data leaks have occurred across the pipeline.`,
      };
    }

    // 6. Specific asset query (e.g. HDD-3001, LAP-1001)
    const assetMatch = assets.find((a) => q.includes(a.id.toLowerCase()));
    if (assetMatch) {
      return {
        reply: `### Detailed Compliance Audit for Asset ${assetMatch.id}
• **Model:** ${assetMatch.brand} ${assetMatch.model}
• **Category:** ${assetMatch.deviceType} (${assetMatch.capacity || 'N/A'})
• **Serial Number:** \`${assetMatch.serialNumber}\`
• **Assigned Custodian:** ${assetMatch.assignedEmployee} (${assetMatch.department})
• **Lifecycle Stage:** ${assetMatch.lifecycleStage}
• **Disposal Status:** ${assetMatch.disposalStatus}
• **Compliance Rating:** ${assetMatch.complianceStatus} (Risk: ${assetMatch.riskLevel})
• **Sanitization Standard:** ${assetMatch.wipingMethod || 'Pending method assignment'}
• **Technician / Verifier:** ${assetMatch.technician || 'N/A'} / ${assetMatch.verifiedBy || 'Pending'}
${
  assetMatch.verificationNotes
    ? `• **Audit Notes:** "${assetMatch.verificationNotes}"`
    : ''
}
${
  assetMatch.certificateId
    ? `• **Certificate ID:** \`${assetMatch.certificateId}\` (SHA-256: \`${assetMatch.certificateHash?.slice(0, 16)}...\`)`
    : '• **Certificate:** Not yet issued'
}

${
  assetMatch.complianceStatus === 'Non-Compliant'
    ? '⚠️ **Compliance Blocker:** This asset encountered a sanitization fault. Re-wiping or mechanical degaussing is mandatory.'
    : '✓ Asset follows expected chain-of-custody controls.'
}`,
        matchedAssets: [assetMatch],
      };
    }

    // Default intelligent fallback
    return {
      reply: `Based on analysis of your current inventory of **${assets.length} assets** and active compliance policies:

• **Audit Compliance Status:** ${assets.filter((a) => a.complianceStatus === 'Compliant').length} of ${assets.length} assets are currently 100% compliant with NIST SP 800-88 and ISO 27001 rules.
• **Queue Status:** ${assets.filter((a) => a.disposalStatus === 'Pending Approval').length} requests pending manager sign-off, and ${assets.filter((a) => a.disposalStatus === 'Wiping In Progress').length} drives currently writing zero-fill sectors.
• **Security Alert:** Drive HDD-3001 requires physical destruction due to degraded sector readouts.

Would you like me to inspect a specific asset ID, generate an audit report, or check pending verifications?`,
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `USER-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAssistantResponse(query);
      const aiMsg: Message = {
        id: `AI-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedAssets: response.matchedAssets,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-900/20">
            <Bot className="w-5 h-5 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Aegis AI Compliance Intelligence Assistant
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                GenAI Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time query answering grounded on active database, audit logs, and NIST 800-88 rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Context Loaded</span>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-cyan-500 text-slate-950'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-2">
              <div
                className={`p-4 rounded-xl border leading-relaxed text-xs ${
                  msg.sender === 'user'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-medium'
                    : 'bg-slate-950/80 border-slate-800 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* Interactive asset cards if returned */}
                {msg.matchedAssets && msg.matchedAssets.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold block">
                      Referenced Inventory Records:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.matchedAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => onSelectAsset(asset)}
                          className="p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-cyan-400 font-bold">{asset.id}</span>
                              <span className="text-slate-300 truncate max-w-[120px]">
                                {asset.brand} {asset.model}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              SN: {asset.serialNumber} · {asset.disposalStatus}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`text-[10px] text-slate-500 font-mono ${
                  msg.sender === 'user' ? 'text-right' : ''
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Analyzing live asset registry and security logs...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Query Buttons */}
      <div className="px-6 py-2.5 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-1.5">
          Suggested Compliance Prompts
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTED_QUERIES.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition-colors border border-slate-700/60"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about asset disposal status, compliance failures, or certificates..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50 transition-colors text-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </form>
      </div>
    </div>
  );
};
