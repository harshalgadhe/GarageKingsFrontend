import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-[100svh] bg-gk-black text-white flex flex-col justify-between relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gk-orange/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-30" />

      <Navigation activeSection="" />

      <div className="max-w-md w-full mx-auto px-6 py-24 md:py-32 flex flex-col items-center justify-center text-center relative z-10 flex-1">
        <span className="text-[10px] font-black tracking-[0.3em] text-gk-orange uppercase mb-3 block font-mono">
          System Alert // 404
        </span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase font-grotesk text-white leading-none mb-4">
          VAULT<br />
          <span className="text-gk-gold">ERROR</span>
        </h1>
        <div className="h-[2px] w-12 bg-gk-orange/50 my-6 rounded-full" />
        <p className="text-xs text-white/50 leading-relaxed font-inter mb-10 max-w-[34ch]">
          The catalog page you are looking for has been archived, de-listed, or does not exist in our central database.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gk-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(255,85,0,0.2)] hover:shadow-[0_0_40px_rgba(255,85,0,0.35)] hover:-translate-y-0.5 active:translate-y-0"
        >
          ← Return to Vault
        </Link>
      </div>

      <Footer />
    </div>
  )
}
