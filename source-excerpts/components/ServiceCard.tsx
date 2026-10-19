"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import Link from "next/link";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: (index: number) => ({
    opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.1 }
  })
};

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  index: number;
  slug: string; // Добавили slug для ссылки
}

export default function ServiceCard({ title, description, icon, index, slug }: ServiceCardProps) {
  return (
    <motion.div 
      custom={index} 
      variants={cardVariants} 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, margin: "-50px" }} 
      className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative group overflow-hidden hover:border-[#e67e22]/50 transition-all duration-300 flex flex-col justify-between"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#e67e22]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div 
          className="bg-slate-950 w-14 h-14 rounded-xl flex items-center justify-center mb-6 border border-slate-800 group-hover:border-[#e67e22]/50 transition-all duration-300" 
          aria-hidden="true"
        >
          <div className="group-hover:scale-110 transition-transform duration-300">{icon}</div>
        </div>
        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{description}</p>
      </div>
      
      {/* Ссылка на подробную страницу */}
      <div className="relative z-10 pt-4 border-t border-slate-800/60 flex justify-between items-center text-sm font-semibold text-[#e67e22] group-hover:text-white transition-colors">
        <Link href={`/services/${slug}`} className="absolute inset-0 z-20" aria-label={`Подробнее об услуге ${title}`} />
        <span>Подробнее об услуге</span>
        <span className="transform group-hover:translate-x-1 transition-transform">➔</span>
      </div>
    </motion.div>
  );
}