import React from 'react';
import { ShieldCheck, Zap, Layers, Wand2, Sliders, Image as ImageIcon } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Private & Secure',
      description: 'Photos stay local on your device using client-side WebAssembly matting or encrypted cloud proxy.',
    },
    {
      icon: Zap,
      title: 'Real-Time Edge Matting',
      description: 'Isolate fine hair strands, pet fur, glass transparency, and complex foreground subjects in seconds.',
    },
    {
      icon: Wand2,
      title: 'Studio Backdrops',
      description: 'Seamlessly replace backgrounds with studio colors, mesh gradients, blurred depth of field, or custom photos.',
    },
    {
      icon: Sliders,
      title: 'Manual Refine Brush',
      description: 'Fine-tune edges manually using the interactive canvas brush & eraser tool with undo/redo stack.',
    },
    {
      icon: ImageIcon,
      title: '3D Shadows & Sticker Outlines',
      description: 'Add drop shadows or white border sticker outlines for YouTube thumbnails, e-commerce, and marketing.',
    },
    {
      icon: Layers,
      title: 'Batch Processing & HD Export',
      description: 'Process multi-image queues and export high-resolution PNG, JPG, or WEBP files with custom aspect ratios.',
    },
  ];

  return (
    <section className="py-12 max-w-5xl mx-auto px-4 border-t border-zinc-800/80 mt-12">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h2 className="text-xl font-bold text-white tracking-tight mb-1">
          Designed for Creators & E-Commerce
        </h2>
        <p className="text-xs text-zinc-400">
          Everything you need for product mockups, profile avatars, YouTube thumbnails, and marketing design.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="studio-card studio-card-hover rounded-xl p-4 border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-blue-400 mb-3 shadow-sm">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
