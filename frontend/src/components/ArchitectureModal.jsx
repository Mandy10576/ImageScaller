import React from 'react';
import { X, GitFork, CheckCircle, Server, Cpu, Database, Layers, ArrowDown } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const flowSteps = [
    {
      step: '1',
      title: 'User & React Frontend',
      desc: 'User uploads low-res image & selects upscale factor (2x, 4x, 8x). Initiates polling status.',
      tech: 'React + Vite',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    {
      step: '2',
      title: 'Express Backend API (Node.js)',
      desc: 'Saves job record into PostgreSQL DB via Prisma & enqueues job to BullMQ queue.',
      tech: 'Express + Prisma + Multer',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    {
      step: '3',
      title: 'BullMQ Queue & Redis',
      desc: 'Asynchronous job queue buffers upscaling jobs with concurrency control.',
      tech: 'BullMQ + Redis',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    },
    {
      step: '4',
      title: 'Worker Microservice (Node.js)',
      desc: 'Worker picks up job, downloads input path, and issues HTTP REST API request to Python service.',
      tech: 'Node.js Worker',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
    {
      step: '5',
      title: 'Python FastAPI AI Service',
      desc: 'Real-ESRGAN model is loaded ONCE in memory at startup. Processes super-resolution matrix scaling.',
      tech: 'Python FastAPI + Real-ESRGAN',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    },
    {
      step: '6',
      title: 'Database Update & Download',
      desc: 'Worker receives success payload, updates PostgreSQL status to COMPLETED. Frontend renders download & comparison.',
      tech: 'PostgreSQL + React UI',
      color: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto min-h-screen">
      <div className="bg-zinc-900 p-6 rounded-2xl max-w-3xl w-full border border-zinc-700/90 shadow-2xl relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 mb-6 pr-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System Architecture & Processing Flow</h3>
            <p className="text-xs text-zinc-400">High-throughput asynchronous AI Image Upscaling service architecture</p>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {flowSteps.map((item, idx) => (
            <div key={idx} className="studio-card p-3.5 rounded-xl border border-zinc-800 flex items-start space-x-3">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${item.color}`}>
                {item.step}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {item.tech}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Close Architecture
          </button>
        </div>

      </div>
    </div>
  );
}
